import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AppointmentType } from '../entities/appointment-type.entity';

@Injectable()
export class AppointmentTypesRepository extends Repository<AppointmentType> {
  constructor(private readonly dataSource: DataSource) {
    super(AppointmentType, dataSource.createEntityManager());
  }
}
