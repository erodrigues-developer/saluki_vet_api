import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { FilterPrescriptionsDto } from './dto/filter-prescriptions.dto';
import { Prescription } from './entities/prescription.entity';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@Controller({
  path: 'prescriptions',
  version: '1',
})
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Emite uma nova prescricao digital' })
  @ApiCreatedResponse({ type: Prescription })
  create(@Body() payload: CreatePrescriptionDto, @Req() req: any) {
    return this.prescriptionsService.create(payload, req.user?.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista prescricoes por pet ou consulta' })
  @ApiOkResponse({ type: Prescription, isArray: true })
  findAll(@Query() query: FilterPrescriptionsDto) {
    return this.prescriptionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha uma prescricao' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: Prescription })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prescriptionsService.findOne(id);
  }
}
