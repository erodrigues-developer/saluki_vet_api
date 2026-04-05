import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
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
import { ClinicalParametersService } from './clinical-parameters.service';
import { CreateClinicalParameterDto } from './dto/create-clinical-parameter.dto';
import { ClinicalParameter } from './entities/clinical-parameter.entity';

@ApiTags('Clinical Parameters')
@ApiBearerAuth()
@Controller({
  path: 'inpatient-records/:inpatientRecordId/clinical-parameters',
  version: '1',
})
export class ClinicalParametersController {
  constructor(
    private readonly clinicalParametersService: ClinicalParametersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registra uma nova afericao clinica' })
  @ApiParam({ name: 'inpatientRecordId', type: Number })
  @ApiCreatedResponse({ type: ClinicalParameter })
  create(
    @Param('inpatientRecordId', ParseIntPipe) inpatientRecordId: number,
    @Body() payload: CreateClinicalParameterDto,
    @Req() req: any,
  ) {
    return this.clinicalParametersService.create(
      inpatientRecordId,
      payload,
      req.user?.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lista o feed de sinais vitais da internacao' })
  @ApiParam({ name: 'inpatientRecordId', type: Number })
  @ApiOkResponse({ type: ClinicalParameter, isArray: true })
  findAll(@Param('inpatientRecordId', ParseIntPipe) inpatientRecordId: number) {
    return this.clinicalParametersService.findAll(inpatientRecordId);
  }
}
