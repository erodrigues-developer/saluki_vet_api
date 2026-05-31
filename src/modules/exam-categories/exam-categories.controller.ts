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
import { ExamCategoriesService } from './exam-categories.service';
import { CreateExamCategoryDto } from './dto/create-exam-category.dto';
import { UpdateExamCategoryDto } from './dto/update-exam-category.dto';
import { FilterExamCategoriesDto } from './dto/filter-exam-categories.dto';
import { ExamCategory } from './entities/exam-category.entity';

@ApiTags('Exam Categories')
@ApiBearerAuth()
@Controller({
  path: 'exam-categories',
  version: '1',
})
export class ExamCategoriesController {
  constructor(
    private readonly examCategoriesService: ExamCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma categoria de exame' })
  @ApiCreatedResponse({
    description: 'Categoria criada com sucesso',
    type: ExamCategory,
  })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  create(@Body() payload: CreateExamCategoryDto) {
    return this.examCategoriesService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Lista categorias de exame com filtros e paginação' })
  @ApiOkResponse({ description: 'Lista paginada de categorias de exame' })
  @ApiQuery({ name: 'name', required: false, example: 'Lab' })
  @ApiQuery({ name: 'isActive', required: false, example: true })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'createdAt',
    description: 'name | isActive | createdAt | updatedAt',
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    example: 'desc',
    description: 'asc | desc',
  })
  findAll(@Query() query: FilterExamCategoriesDto) {
    return this.examCategoriesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma categoria de exame por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Categoria encontrada', type: ExamCategory })
  @ApiNotFoundResponse({ description: 'Categoria não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examCategoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma categoria de exame' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Categoria atualizada', type: ExamCategory })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiNotFoundResponse({ description: 'Categoria não encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateExamCategoryDto,
  ) {
    return this.examCategoriesService.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma categoria de exame' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Categoria removida' })
  @ApiNotFoundResponse({ description: 'Categoria não encontrada' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.examCategoriesService.remove(id);
  }
}
