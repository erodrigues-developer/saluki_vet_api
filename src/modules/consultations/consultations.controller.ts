import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { Consultation } from './entities/consultation.entity';

@ApiTags('Consultations')
@ApiBearerAuth()
@Controller({
  path: 'consultations',
  version: '1',
})
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  @ApiOperation({ summary: 'Inicia ou salva uma nova consulta' })
  @ApiOkResponse({ type: Consultation })
  create(@Body() payload: any) {
    return this.consultationsService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Lista consultas com paginação e filtros' })
  findAll(@Query() query: any) {
    return this.consultationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma consulta por ID' })
  @ApiOkResponse({ type: Consultation })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consultationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados da consulta em andamento' })
  @ApiOkResponse({ type: Consultation })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.consultationsService.update(id, payload);
  }
}
