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
import { SpeciesService } from './species.service';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';
import { FilterSpeciesDto } from './dto/filter-species.dto';
import { Species } from './entities/species.entity';
import { PaginatedSpeciesResponseDto } from './dto/paginated-species-response.dto';

@ApiTags('Species')
@Controller({
  path: 'species',
  version: '1',
})
export class SpeciesController {
  constructor(private readonly speciesService: SpeciesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma espécie' })
  @ApiCreatedResponse({
    description: 'Espécie criada com sucesso',
    type: Species,
  })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  create(@Body() createSpeciesDto: CreateSpeciesDto) {
    return this.speciesService.create(createSpeciesDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista espécies com filtros e paginação',
    description: 'Filtra por nome e permite ordenação/paginação.',
  })
  @ApiOkResponse({
    description: 'Lista paginada de espécies',
    type: PaginatedSpeciesResponseDto,
  })
  @ApiQuery({ name: 'name', required: false, example: 'Cachorro' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'createdAt',
    description: 'name | createdAt | updatedAt',
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    example: 'desc',
    description: 'asc | desc',
  })
  findAll(@Query() query: FilterSpeciesDto) {
    return this.speciesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma espécie por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Espécie encontrada', type: Species })
  @ApiNotFoundResponse({ description: 'Espécie não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.speciesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma espécie' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Espécie atualizada', type: Species })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiNotFoundResponse({ description: 'Espécie não encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSpeciesDto: UpdateSpeciesDto,
  ) {
    return this.speciesService.update(id, updateSpeciesDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma espécie' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Espécie removida' })
  @ApiNotFoundResponse({ description: 'Espécie não encontrada' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.speciesService.remove(id);
  }
}
