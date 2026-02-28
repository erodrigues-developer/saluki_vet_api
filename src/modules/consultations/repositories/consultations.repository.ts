import { Injectable } from '@nestjs/common';
import { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { Consultation } from '../entities/consultation.entity';

@Injectable()
export class ConsultationsRepository extends Repository<Consultation> {
  constructor(private readonly dataSource: DataSource) {
    super(Consultation, dataSource.createEntityManager());
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    petId?: number;
    clientId?: number;
    veterinarianId?: number;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
  }): Promise<[Consultation[], number]> {
    const {
      page,
      limit,
      petId,
      clientId,
      veterinarianId,
      sortBy,
      sortDirection,
    } = params;

    const where: FindOptionsWhere<Consultation> = {};
    if (petId) where.petId = petId;
    if (clientId) where.clientId = clientId;
    if (veterinarianId) where.veterinarianId = veterinarianId;

    return this.findAndCount({
      where,
      order: {
        [sortBy]: sortDirection,
        id: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
