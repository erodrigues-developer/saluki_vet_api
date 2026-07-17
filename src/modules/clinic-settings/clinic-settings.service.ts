import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { ClinicSettingsRepository } from './repositories/clinic-settings.repository';
import { ClinicSettings } from './entities/clinic-settings.entity';
import { UpdateClinicSettingsDto } from './dto/update-clinic-settings.dto';

type ClinicImageField = 'logo' | 'login';

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
        accountsPayableRecurrenceHorizonMonths: 12,
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

  async uploadImage(
    field: ClinicImageField,
    file: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
    requestBaseUrl: string,
  ): Promise<ClinicSettings> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo de imagem recebido sem conteudo.');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Envie apenas arquivos de imagem.');
    }

    if (Number(file.size || 0) > 5 * 1024 * 1024) {
      throw new BadRequestException('A imagem deve ter no maximo 5 MB para upload.');
    }

    const extension = this.resolveFileExtension(file.originalname, file.mimetype);
    const fileName = `${randomUUID()}${extension}`;
    const folder = field === 'logo' ? 'logos' : 'login';
    const uploadsDir = join(process.cwd(), 'uploads', 'clinic-settings', folder);
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, fileName), file.buffer);

    const imageUrl = `${requestBaseUrl.replace(/\/+$/, '')}/uploads/clinic-settings/${folder}/${fileName}`;
    const settings = await this.getSettings();
    const merged = this.clinicSettingsRepository.merge(settings, {
      ...(field === 'logo' ? { logoUrl: imageUrl } : { loginImageUrl: imageUrl }),
    });
    return this.clinicSettingsRepository.save(merged);
  }

  async removeImage(field: ClinicImageField): Promise<ClinicSettings> {
    const settings = await this.getSettings();
    const merged = this.clinicSettingsRepository.merge(settings, {
      ...(field === 'logo' ? { logoUrl: null } : { loginImageUrl: null }),
    });
    return this.clinicSettingsRepository.save(merged);
  }

  private resolveFileExtension(originalName?: string, mimeType?: string) {
    const originalExtension = extname(String(originalName || '')).toLowerCase();
    if (originalExtension) return originalExtension;

    const mimeToExtension: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };

    return mimeToExtension[String(mimeType || '').toLowerCase()] || '.bin';
  }
}
