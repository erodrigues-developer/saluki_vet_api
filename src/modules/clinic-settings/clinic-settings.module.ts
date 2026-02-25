import { ClinicSettings } from "./entities/clinic-settings.entity";
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ClinicSettingsService } from './clinic-settings.service';
import { ClinicSettingsController } from './clinic-settings.controller';
import { ClinicSettingsRepository } from './repositories/clinic-settings.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicSettings])],
  controllers: [ClinicSettingsController],
  providers: [ClinicSettingsService, ClinicSettingsRepository],
  exports: [ClinicSettingsService],
})
export class ClinicSettingsModule {}
