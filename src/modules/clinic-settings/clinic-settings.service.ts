import { Injectable, NotFoundException } from '@nestjs/common';
import { ClinicSettingsRepository } from './repositories/clinic-settings.repository';
import { ClinicSettings } from './entities/clinic-settings.entity';
import { UpdateClinicSettingsDto } from './dto/update-clinic-settings.dto';

@Injectable()
export class ClinicSettingsService {
  constructor(
    private readonly clinicSettingsRepository: ClinicSettingsRepository,
  ) {}

  async getSettings(): Promise<ClinicSettings> {
    let settings = await this.clinicSettingsRepository.findOne({ where: {} });
    if (!settings) {
      // Cria configurações padrão se não existirem
      settings = this.clinicSettingsRepository.create({
        appointmentSlotDurationMinutes: 30,
        defaultCurrency: 'BRL',
      });
      await this.clinicSettingsRepository.save(settings);
    }
    return settings;
  }

  async update(payload: UpdateClinicSettingsDto): Promise<ClinicSettings> {
    const settings = await this.getSettings();
    const merged = this.clinicSettingsRepository.merge(settings, payload);
    return this.clinicSettingsRepository.save(merged);
  }
}
