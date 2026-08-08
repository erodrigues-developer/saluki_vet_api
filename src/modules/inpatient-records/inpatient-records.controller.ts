import {
  Body,
  Controller,
  Get,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { InpatientRecordsService } from './inpatient-records.service';
import { InpatientRecord } from './entities/inpatient-record.entity';
import { CreateInpatientRecordDto } from './dto/create-inpatient-record.dto';
import { FilterInpatientRecordsDto } from './dto/filter-inpatient-records.dto';
import { DischargeInpatientRecordDto } from './dto/discharge-inpatient-record.dto';
import { TransferInpatientRecordDto } from './dto/transfer-inpatient-record.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Inpatient Records')
@ApiBearerAuth()
@Controller({
  path: 'inpatient-records',
  version: '1',
})
@Permissions('atendimentos.inpatient_records.view')
export class InpatientRecordsController {
  constructor(
    private readonly inpatientRecordsService: InpatientRecordsService,
  ) {}

  @Post()
  @Permissions('atendimentos.inpatient_records.create')
  @ApiOperation({ summary: 'Admite um paciente na internacao' })
  @ApiCreatedResponse({ type: InpatientRecord })
  @ApiBadRequestResponse({ description: 'Regra de internacao violada' })
  create(@Body() payload: CreateInpatientRecordDto) {
    return this.inpatientRecordsService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Lista internacoes com filtros' })
  @ApiOkResponse({ type: InpatientRecord, isArray: true })
  findAll(@Query() query: FilterInpatientRecordsDto) {
    return this.inpatientRecordsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha a ficha de internacao' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: InpatientRecord })
  @ApiNotFoundResponse({ description: 'Internacao nao encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inpatientRecordsService.findOne(id);
  }

  @Patch(':id/discharge')
  @Permissions('atendimentos.inpatient_records.discharge')
  @ApiOperation({ summary: 'Da alta ao paciente internado' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: InpatientRecord })
  @ApiBadRequestResponse({ description: 'Internacao nao esta ativa' })
  discharge(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: DischargeInpatientRecordDto,
  ) {
    return this.inpatientRecordsService.discharge(id, payload);
  }

  @Patch(':id/transfer')
  @Permissions('atendimentos.inpatient_records.transfer')
  @ApiOperation({ summary: 'Transfere o paciente para outro leito vazio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: InpatientRecord })
  @ApiBadRequestResponse({ description: 'Leito de destino invalido ou ocupado' })
  transfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: TransferInpatientRecordDto,
  ) {
    return this.inpatientRecordsService.transfer(id, payload);
  }
}
