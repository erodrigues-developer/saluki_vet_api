import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { Consultation } from './entities/consultation.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Consultations')
@ApiBearerAuth()
@Controller({
  path: 'consultations',
  version: '1',
})
@Permissions('atendimentos.consultations.view')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  @Permissions('atendimentos.consultations.create')
  @ApiOperation({ summary: 'Inicia ou salva uma nova consulta' })
  @ApiOkResponse({ type: Consultation })
  create(@Body() payload: any, @Req() req: any) {
    return this.consultationsService.create(payload, req.user?.userId);
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
  @Permissions('atendimentos.consultations.update')
  @ApiOperation({ summary: 'Atualiza dados da consulta em andamento' })
  @ApiOkResponse({ type: Consultation })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any, @Req() req: any) {
    return this.consultationsService.update(id, payload, req.user?.userId);
  }

  @Post(':id/finalize')
  @Permissions('atendimentos.consultations.finalize')
  @ApiOperation({ summary: 'Finaliza atendimento e registra prontuário oficial' })
  @ApiOkResponse({ type: Consultation })
  finalize(@Param('id', ParseIntPipe) id: number, @Body() payload: any, @Req() req: any) {
    return this.consultationsService.update(id, {
      ...payload,
      recordStatus: 'FINALIZED',
    }, req.user?.userId);
  }

  @Post(':id/finalize-and-bill')
  @Permissions('atendimentos.consultations.finalize_and_bill')
  @ApiOperation({
    summary:
      'Finaliza o atendimento, conclui o agendamento relacionado e prepara a venda para cobrança',
  })
  finalizeAndBill(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: any,
    @Req() req: any,
  ) {
    return this.consultationsService.finalizeAndBill(
      id,
      payload,
      req.user?.userId,
    );
  }

  @Post(':id/anamnesis/approve')
  @Permissions('atendimentos.consultations.approve_anamnesis')
  @ApiOperation({ summary: 'Aprova anamnese e gera apoio clínico consultivo' })
  @ApiOkResponse({ type: Consultation })
  approveAnamnesis(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: { anamnesisText?: string },
    @Req() req: any,
  ) {
    return this.consultationsService.approveAnamnesis(id, payload, req.user?.userId);
  }
}
