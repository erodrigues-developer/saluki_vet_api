import { Injectable } from '@nestjs/common';
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
        timezone: 'America/Sao_Paulo',
        checkInToleranceMinutes: 10,
      });
      await this.clinicSettingsRepository.save(settings);
    }
    return settings;
  }

  async getBusinessTimezone(): Promise<string> {
    const settings = await this.getSettings();
    const configured = String(settings.timezone || '').trim();
    if (configured) return configured;
    return process.env.CLINIC_TIMEZONE || 'America/Sao_Paulo';
  }

  async update(payload: UpdateClinicSettingsDto): Promise<ClinicSettings> {
    const settings = await this.getSettings();
    const merged = this.clinicSettingsRepository.merge(settings, payload);
    return this.clinicSettingsRepository.save(merged);
  }
}
