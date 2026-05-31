import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ExamType } from './entities/exam-type.entity';
import { ExamTypesService } from './exam-types.service';
import { CreateExamTypeDto } from './dto/create-exam-type.dto';
import { UpdateExamTypeDto } from './dto/update-exam-type.dto';
import { FilterExamTypesDto } from './dto/filter-exam-types.dto';

@ApiTags('Exam Types')
@ApiBearerAuth()
@Controller({
  path: 'exam-types',
  version: '1',
})
export class ExamTypesController {
  constructor(private readonly examTypesService: ExamTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo tipo de exame' })
  @ApiOkResponse({ type: ExamType })
  create(@Body() payload: CreateExamTypeDto) {
    return this.examTypesService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Lista tipos de exame com paginação e filtros' })
  findAll(@Query() query: FilterExamTypesDto) {
    return this.examTypesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um tipo de exame por ID' })
  @ApiOkResponse({ type: ExamType })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um tipo de exame' })
  @ApiOkResponse({ type: ExamType })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateExamTypeDto,
  ) {
    return this.examTypesService.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um tipo de exame' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examTypesService.remove(id);
  }
}
