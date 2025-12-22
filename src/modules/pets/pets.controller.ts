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
} from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { FilterPetsDto } from './dto/filter-pets.dto';
import { Pet } from './entities/pet.entity';
import { PaginatedPetsResponseDto } from './dto/paginated-pets-response.dto';

@ApiTags('Pets')
@Controller({
  path: 'pets',
  version: '1',
})
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um pet' })
  @ApiCreatedResponse({
    description: 'Pet criado com sucesso',
    type: Pet,
  })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  create(@Body() createPetDto: CreatePetDto) {
    return this.petsService.create(createPetDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista pets com filtros e paginação',
    description:
      'Filtra por nome, clientId e microchipCode. Permite ordenação/paginação.',
  })
  @ApiOkResponse({
    description: 'Lista paginada de pets',
    type: PaginatedPetsResponseDto,
  })
  @ApiQuery({ name: 'name', required: false, example: 'Thor' })
  @ApiQuery({ name: 'clientId', required: false, example: 1 })
  @ApiQuery({ name: 'microchipCode', required: false, example: 'MC-123' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'createdAt',
    description: 'name | clientId | microchipCode | createdAt | updatedAt',
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    example: 'desc',
    description: 'asc | desc',
  })
  findAll(@Query() query: FilterPetsDto) {
    return this.petsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um pet por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Pet encontrado', type: Pet })
  @ApiNotFoundResponse({ description: 'Pet não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.petsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um pet' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Pet atualizado', type: Pet })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiNotFoundResponse({ description: 'Pet não encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePetDto: UpdatePetDto,
  ) {
    return this.petsService.update(id, updatePetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove (soft delete) um pet' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Pet removido' })
  @ApiNotFoundResponse({ description: 'Pet não encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.petsService.remove(id);
  }
}
