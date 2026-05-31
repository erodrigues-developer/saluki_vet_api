import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ExamRequestsService } from './exam-requests.service';
import { CreateExamRequestDto } from './dto/create-exam-request.dto';
import { FilterExamRequestsDto } from './dto/filter-exam-requests.dto';
import { ExamRequest } from './entities/exam-request.entity';

@ApiTags('Exam Requests')
@ApiBearerAuth()
@Controller({
  path: 'exam-requests',
  version: '1',
})
export class ExamRequestsController {
  constructor(private readonly examRequestsService: ExamRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um pedido de exames para a consulta/paciente' })
  @ApiCreatedResponse({ type: ExamRequest, isArray: true })
  create(@Body() payload: CreateExamRequestDto) {
    return this.examRequestsService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Lista pedidos de exames por consulta ou paciente' })
  @ApiOkResponse({ type: ExamRequest, isArray: true })
  findAll(@Query() query: FilterExamRequestsDto) {
    return this.examRequestsService.findAll(query);
  }
}
