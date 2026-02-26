import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConsultationProceduresService } from './consultation-procedures.service';
import { ConsultationProcedure } from './entities/consultation-procedure.entity';

@ApiTags('Consultation Procedures')
@ApiBearerAuth()
@Controller({
  path: 'consultation-procedures',
  version: '1',
})
export class ConsultationProceduresController {
  constructor(private readonly consultationProceduresService: ConsultationProceduresService) {}

  @Post()
  @ApiOperation({ summary: 'Adiciona um procedimento à consulta' })
  @ApiOkResponse({ type: ConsultationProcedure })
  create(@Body() payload: any) {
    return this.consultationProceduresService.create(payload);
  }

  @Get('consultation/:consultationId')
  @ApiOperation({ summary: 'Lista procedimentos de uma consulta' })
  @ApiOkResponse({ type: [ConsultationProcedure] })
  findByConsultation(@Param('consultationId', ParseIntPipe) consultationId: number) {
    return this.consultationProceduresService.findByConsultation(consultationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um procedimento da consulta' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.consultationProceduresService.remove(id);
  }
}
