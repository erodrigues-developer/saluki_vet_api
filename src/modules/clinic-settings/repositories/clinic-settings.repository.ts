import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ClinicSettings } from '../entities/clinic-settings.entity';

@Injectable()
export class ClinicSettingsRepository extends Repository<ClinicSettings> {
  constructor(private readonly dataSource: DataSource) {
    super(ClinicSettings, dataSource.createEntityManager());
  }
}
