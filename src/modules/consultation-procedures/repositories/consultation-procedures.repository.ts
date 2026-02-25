import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ConsultationProcedure } from '../entities/consultation-procedure.entity';

@Injectable()
export class ConsultationProceduresRepository extends Repository<ConsultationProcedure> {
  constructor(private readonly dataSource: DataSource) {
    super(ConsultationProcedure, dataSource.createEntityManager());
  }
}
