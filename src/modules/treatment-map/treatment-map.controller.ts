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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TreatmentMapService } from './treatment-map.service';
import { TreatmentMap } from './entities/treatment-map.entity';
import { CreateTreatmentItemDto } from './dto/create-treatment-item.dto';
import { ExecuteTreatmentItemDto } from './dto/execute-treatment-item.dto';
import { FilterTreatmentMapDto } from './dto/filter-treatment-map.dto';

@ApiTags('Treatment Map')
@ApiBearerAuth()
@Controller({
  path: 'inpatient-records/:inpatientRecordId/treatment-map',
  version: '1',
})
export class TreatmentMapController {
  constructor(private readonly treatmentMapService: TreatmentMapService) {}

  @Post()
  @ApiOperation({ summary: 'Agenda item do mapa de tratamento' })
  @ApiParam({ name: 'inpatientRecordId', type: Number })
  @ApiCreatedResponse({ type: TreatmentMap })
  create(
    @Param('inpatientRecordId', ParseIntPipe) inpatientRecordId: number,
    @Body() payload: CreateTreatmentItemDto,
  ) {
    return this.treatmentMapService.create(inpatientRecordId, payload);
  }

  @Get()
  @ApiOperation({ summary: 'Lista itens do mapa de tratamento da internacao' })
  @ApiParam({ name: 'inpatientRecordId', type: Number })
  @ApiOkResponse({ type: TreatmentMap, isArray: true })
  findAll(
    @Param('inpatientRecordId', ParseIntPipe) inpatientRecordId: number,
    @Query() query: FilterTreatmentMapDto,
  ) {
    return this.treatmentMapService.findAll(inpatientRecordId, query);
  }
}
