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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BoxesService } from './boxes.service';
import { FilterBoxesDto } from './dto/filter-boxes.dto';
import { Box } from './entities/box.entity';
import { CreateBoxDto } from './dto/create-box.dto';
import { UpdateBoxDto } from './dto/update-box.dto';
import { PaginatedBoxesResponseDto } from './dto/paginated-boxes-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Boxes')
@ApiBearerAuth()
@Controller({
  path: 'boxes',
  version: '1',
})
export class BoxesController {
  constructor(private readonly boxesService: BoxesService) {}

  @Post()
  @Permissions('cadastros.boxes.create')
  @ApiOperation({ summary: 'Cria um box' })
  @ApiCreatedResponse({
    description: 'Box criado com sucesso',
    type: Box,
  })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  create(@Body() createBoxDto: CreateBoxDto) {
    return this.boxesService.create(createBoxDto);
  }

  @Get()
  @Permissions(
    'cadastros.boxes.view',
    'atendimentos.inpatient_records.view',
    'atendimentos.consultations.view',
    'atendimentos.consultations.create',
  )
  @ApiOperation({
    summary: 'Lista boxes com status de ocupação',
    description:
      'Quando page/limit são enviados, retorna lista paginada. Sem paginação, mantém retorno simples para telas operacionais.',
  })
  @ApiOkResponse({ type: PaginatedBoxesResponseDto })
  @ApiQuery({ name: 'name', required: false, example: 'Canil' })
  @ApiQuery({ name: 'isActive', required: false, example: true })
  @ApiQuery({ name: 'availableOnly', required: false, example: false })
  @ApiQuery({
    name: 'occupancyStatus',
    required: false,
    example: 'AVAILABLE',
    description: 'AVAILABLE | OCCUPIED',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'updatedAt',
    description: 'name | isActive | createdAt | updatedAt',
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    example: 'desc',
    description: 'asc | desc',
  })
  findAll(@Query() query: FilterBoxesDto) {
    return this.boxesService.findAll(query);
  }

  @Get(':id')
  @Permissions(
    'cadastros.boxes.view',
    'atendimentos.inpatient_records.view',
    'atendimentos.consultations.view',
    'atendimentos.consultations.create',
  )
  @ApiOperation({ summary: 'Busca um box por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Box encontrado', type: Box })
  @ApiNotFoundResponse({ description: 'Box não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.boxesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('cadastros.boxes.update')
  @ApiOperation({ summary: 'Atualiza um box' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Box atualizado', type: Box })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiNotFoundResponse({ description: 'Box não encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBoxDto: UpdateBoxDto,
  ) {
    return this.boxesService.update(id, updateBoxDto);
  }

  @Delete(':id')
  @Permissions('cadastros.boxes.delete')
  @ApiOperation({ summary: 'Remove um box sem internações vinculadas' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Box removido' })
  @ApiNotFoundResponse({ description: 'Box não encontrado' })
  @ApiBadRequestResponse({
    description: 'Box possui internações vinculadas e não pode ser removido',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.boxesService.remove(id);
  }
}
