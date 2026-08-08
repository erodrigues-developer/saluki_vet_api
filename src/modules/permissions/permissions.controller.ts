import { Body, Controller, Get, Param, ParseIntPipe, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from './entities/permission.entity';
import { PermissionsService } from './permissions.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller({ path: 'permissions', version: '1' })
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions('cadastros.permissions.view')
  @ApiOperation({ summary: 'Lista o catálogo de permissões' })
  @ApiOkResponse({ type: [Permission] })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('roles/:roleId')
  @Permissions('cadastros.permissions.view')
  @ApiOperation({ summary: 'Lista permissões de um papel' })
  @ApiOkResponse({ type: [Permission] })
  findRolePermissions(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.permissionsService.findRolePermissions(roleId);
  }

  @Put('roles/:roleId')
  @Permissions('cadastros.permissions.manage')
  @ApiOperation({ summary: 'Atualiza permissões de um papel' })
  @ApiOkResponse({ type: [Permission] })
  updateRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.permissionsService.updateRolePermissions(
      roleId,
      dto.permissionCodes,
    );
  }
}
