import { Injectable } from '@nestjs/common';
import { DataSource, Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';

@Injectable()
export class AppointmentsRepository extends Repository<Appointment> {
  constructor(private readonly dataSource: DataSource) {
    super(Appointment, dataSource.createEntityManager());
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    petId?: number;
    clientId?: number;
    veterinarianId?: number;
    statusId?: number;
    dateFrom?: string;
    dateTo?: string;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
  }): Promise<[Appointment[], number]> {
    const {
      page,
      limit,
      petId,
      clientId,
      veterinarianId,
      statusId,
      sortBy,
      sortDirection,
    } = params;

    const where: FindOptionsWhere<Appointment> = {};
    if (petId) where.petId = petId;
    if (clientId) where.clientId = clientId;
    if (veterinarianId) where.veterinarianId = veterinarianId;
    if (statusId) where.statusId = statusId;

    return this.findAndCount({
      where,
      relations: ['appointmentType', 'status'],
      order: {
        [sortBy]: sortDirection,
        id: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
