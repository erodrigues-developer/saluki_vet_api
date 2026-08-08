import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { User } from './entities/user.entity';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller({
  path: 'users',
  version: '1',
})
@Permissions('cadastros.users.view')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('cadastros.users.create')
  @ApiOperation({ summary: 'Cria um usuário' })
  @ApiCreatedResponse({ description: 'Usuário criado com sucesso', type: User })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions(
    'cadastros.users.view',
    'atendimentos.appointments.view',
    'atendimentos.consultations.view',
    'atendimentos.exam_requests.print',
    'financeiro.sales.view',
    'financeiro.sales.create',
    'financeiro.commissions.view',
    'configuracoes.availability.view',
  )
  @ApiOperation({ summary: 'Lista usuários com filtros e paginação' })
  @ApiOkResponse({
    description: 'Lista paginada de usuários',
    type: PaginatedUsersResponseDto,
  })
  findAll(@Query() query: FilterUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Permissions(
    'cadastros.users.view',
    'atendimentos.appointments.view',
    'atendimentos.consultations.view',
    'atendimentos.exam_requests.print',
    'financeiro.sales.view',
    'financeiro.sales.create',
    'financeiro.commissions.view',
    'configuracoes.availability.view',
  )
  @ApiOperation({ summary: 'Busca um usuário por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Usuário encontrado', type: User })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('cadastros.users.update')
  @ApiOperation({ summary: 'Atualiza um usuário' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Usuário atualizado', type: User })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ) {
    return this.usersService.update(id, updateUserDto, Number(req.user?.userId));
  }

  @Delete(':id')
  @Permissions('cadastros.users.delete')
  @ApiOperation({ summary: 'Remove um usuário' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Usuário removido' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.usersService.remove(id, Number(req.user?.userId));
  }
}
