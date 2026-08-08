import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TreatmentMapService } from './treatment-map.service';
import { ExecuteTreatmentItemDto } from './dto/execute-treatment-item.dto';
import { TreatmentMap } from './entities/treatment-map.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Treatment Map')
@ApiBearerAuth()
@Controller({
  path: 'treatment-map',
  version: '1',
})
export class TreatmentMapActionsController {
  constructor(private readonly treatmentMapService: TreatmentMapService) {}

  @Patch(':id/execute')
  @Permissions('atendimentos.treatment_map.execute')
  @ApiOperation({ summary: 'Executa item pendente do mapa de tratamento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: TreatmentMap })
  execute(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: ExecuteTreatmentItemDto,
    @Req() req: any,
  ) {
    return this.treatmentMapService.execute(id, payload, req.user?.userId);
  }
}
