import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConsultationProceduresService } from './consultation-procedures.service';
import { ConsultationProcedure } from './entities/consultation-procedure.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Consultation Procedures')
@ApiBearerAuth()
@Controller({
  path: 'consultation-procedures',
  version: '1',
})
export class ConsultationProceduresController {
  constructor(
    private readonly consultationProceduresService: ConsultationProceduresService,
  ) {}

  @Post()
  @Permissions('atendimentos.consultations.update')
  @ApiOperation({ summary: 'Adiciona um procedimento à consulta' })
  @ApiOkResponse({ type: ConsultationProcedure })
  create(@Body() payload: any) {
    return this.consultationProceduresService.create(payload);
  }

  @Patch(':id')
  @Permissions('atendimentos.consultations.update')
  @ApiOperation({ summary: 'Atualiza um procedimento da consulta' })
  @ApiOkResponse({ type: ConsultationProcedure })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.consultationProceduresService.update(id, payload);
  }

  @Get('consultation/:consultationId')
  @Permissions('atendimentos.consultations.view')
  @ApiOperation({ summary: 'Lista procedimentos de uma consulta' })
  @ApiOkResponse({ type: [ConsultationProcedure] })
  findByConsultation(
    @Param('consultationId', ParseIntPipe) consultationId: number,
  ) {
    return this.consultationProceduresService.findByConsultation(
      consultationId,
    );
  }

  @Delete(':id')
  @Permissions('atendimentos.consultations.update')
  @ApiOperation({ summary: 'Remove um procedimento da consulta' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.consultationProceduresService.remove(id);
  }
}
