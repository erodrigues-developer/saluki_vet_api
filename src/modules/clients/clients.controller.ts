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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiNoContentResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterClientsDto } from './dto/filter-clients.dto';
import { Client } from './entities/client.entity';
import { PaginatedClientsResponseDto } from './dto/paginated-clients-response.dto';

@ApiTags('Clients')
@Controller({
  path: 'clients',
  version: '1',
})
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um cliente' })
  @ApiCreatedResponse({
    description: 'Cliente criado com sucesso',
    type: Client,
  })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista clientes com filtros e paginação',
    description:
      'Permite filtrar por nome, documento, email e status ativo. Suporta paginação.',
  })
  @ApiOkResponse({
    description: 'Lista paginada de clientes',
    type: PaginatedClientsResponseDto,
  })
  @ApiQuery({ name: 'name', required: false, example: 'Maria' })
  @ApiQuery({ name: 'document', required: false, example: '12345678900' })
  @ApiQuery({
    name: 'email',
    required: false,
    example: 'cliente@email.com',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    example: true,
    description: 'true ou false',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(@Query() query: FilterClientsDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um cliente por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Cliente encontrado', type: Client })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um cliente' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Cliente atualizado', type: Client })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove (soft delete) um cliente' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Cliente removido' })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.clientsService.remove(id);
  }
}
