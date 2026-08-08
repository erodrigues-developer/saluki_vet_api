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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BreedsService } from './breeds.service';
import { CreateBreedDto } from './dto/create-breed.dto';
import { UpdateBreedDto } from './dto/update-breed.dto';
import { FilterBreedsDto } from './dto/filter-breeds.dto';
import { Breed } from './entities/breed.entity';
import { PaginatedBreedsResponseDto } from './dto/paginated-breeds-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Breeds')
@ApiBearerAuth()
@Controller({
  path: 'breeds',
  version: '1',
})
export class BreedsController {
  constructor(private readonly breedsService: BreedsService) {}

  @Post()
  @Permissions('cadastros.breeds.create')
  @ApiOperation({ summary: 'Cria uma raça' })
  @ApiCreatedResponse({
    description: 'Raça criada com sucesso',
    type: Breed,
  })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  create(@Body() createBreedDto: CreateBreedDto) {
    return this.breedsService.create(createBreedDto);
  }

  @Get()
  @Permissions(
    'cadastros.breeds.view',
    'atendimentos.appointments.view',
    'clientes.clients.view',
    'pets.pets.view',
  )
  @ApiOperation({
    summary: 'Lista raças com filtros e paginação',
    description: 'Filtra por nome e speciesId; permite ordenação/paginação.',
  })
  @ApiOkResponse({
    description: 'Lista paginada de raças',
    type: PaginatedBreedsResponseDto,
  })
  @ApiQuery({ name: 'name', required: false, example: 'Bull' })
  @ApiQuery({ name: 'speciesId', required: false, example: 1 })
  @ApiQuery({ name: 'isActive', required: false, example: true })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'createdAt',
    description: 'name | speciesId | isActive | createdAt | updatedAt',
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    example: 'desc',
    description: 'asc | desc',
  })
  findAll(@Query() query: FilterBreedsDto) {
    return this.breedsService.findAll(query);
  }

  @Get(':id')
  @Permissions(
    'cadastros.breeds.view',
    'atendimentos.appointments.view',
    'clientes.clients.view',
    'pets.pets.view',
  )
  @ApiOperation({ summary: 'Busca uma raça por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Raça encontrada', type: Breed })
  @ApiNotFoundResponse({ description: 'Raça não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.breedsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('cadastros.breeds.update')
  @ApiOperation({ summary: 'Atualiza uma raça' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Raça atualizada', type: Breed })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiNotFoundResponse({ description: 'Raça não encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBreedDto: UpdateBreedDto,
  ) {
    return this.breedsService.update(id, updateBreedDto);
  }

  @Delete(':id')
  @Permissions('cadastros.breeds.delete')
  @ApiOperation({ summary: 'Remove uma raça' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Raça removida' })
  @ApiNotFoundResponse({ description: 'Raça não encontrada' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.breedsService.remove(id);
  }
}
