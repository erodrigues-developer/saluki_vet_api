import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AppointmentStatus } from '../entities/appointment-status.entity';

@Injectable()
export class AppointmentStatusesRepository extends Repository<AppointmentStatus> {
  constructor(private readonly dataSource: DataSource) {
    super(AppointmentStatus, dataSource.createEntityManager());
  }
}
