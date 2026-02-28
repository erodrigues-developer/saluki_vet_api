import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClinicSettingsService } from './clinic-settings.service';
import { ClinicSettings } from './entities/clinic-settings.entity';
import { UpdateClinicSettingsDto } from './dto/update-clinic-settings.dto';

@ApiTags('Clinic Settings')
@ApiBearerAuth()
@Controller({
  path: 'clinic-settings',
  version: '1',
})
export class ClinicSettingsController {
  constructor(private readonly clinicSettingsService: ClinicSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Busca as configurações da clínica' })
  @ApiOkResponse({ type: ClinicSettings })
  getSettings() {
    return this.clinicSettingsService.getSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Atualiza as configurações da clínica' })
  @ApiOkResponse({ type: ClinicSettings })
  update(@Body() payload: UpdateClinicSettingsDto) {
    return this.clinicSettingsService.update(payload);
  }
}
