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
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Exam Types')
@ApiBearerAuth()
@Controller({
  path: 'exam-types',
  version: '1',
})
export class ExamTypesController {
  constructor(private readonly examTypesService: ExamTypesService) {}

  @Post()
  @Permissions('cadastros.exam_types.create')
  @ApiOperation({ summary: 'Cria um novo tipo de exame' })
  @ApiOkResponse({ type: ExamType })
  create(@Body() payload: CreateExamTypeDto) {
    return this.examTypesService.create(payload);
  }

  @Get()
  @Permissions(
    'cadastros.exam_types.view',
    'atendimentos.exam_requests.view',
    'atendimentos.exam_requests.create',
  )
  @ApiOperation({ summary: 'Lista tipos de exame com paginação e filtros' })
  findAll(@Query() query: FilterExamTypesDto) {
    return this.examTypesService.findAll(query);
  }

  @Get(':id')
  @Permissions(
    'cadastros.exam_types.view',
    'atendimentos.exam_requests.view',
    'atendimentos.exam_requests.create',
  )
  @ApiOperation({ summary: 'Busca um tipo de exame por ID' })
  @ApiOkResponse({ type: ExamType })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examTypesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('cadastros.exam_types.update')
  @ApiOperation({ summary: 'Atualiza um tipo de exame' })
  @ApiOkResponse({ type: ExamType })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateExamTypeDto,
  ) {
    return this.examTypesService.update(id, payload);
  }

  @Delete(':id')
  @Permissions('cadastros.exam_types.delete')
  @ApiOperation({ summary: 'Remove um tipo de exame' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examTypesService.remove(id);
  }
}
