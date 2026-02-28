import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller({
  path: 'roles',
  version: '1',
})
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os papéis' })
  @ApiOkResponse({ description: 'Lista de papéis', type: [Role] })
  findAll() {
    return this.rolesService.findAll();
  }
}
