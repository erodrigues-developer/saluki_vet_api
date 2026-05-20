import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
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
    lateOnly?: boolean;
    lateThreshold?: Date;
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
      lateOnly,
      lateThreshold,
      sortBy,
      sortDirection,
    } = params;

    const qb = this.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.appointmentType', 'appointmentType')
      .leftJoinAndSelect('appointment.status', 'status');

    if (petId) qb.andWhere('appointment.pet_id = :petId', { petId });
    if (clientId) qb.andWhere('appointment.client_id = :clientId', { clientId });
    if (veterinarianId) {
      qb.andWhere('appointment.veterinarian_id = :veterinarianId', {
        veterinarianId,
      });
    }
    if (statusId) qb.andWhere('appointment.status_id = :statusId', { statusId });

    if (lateOnly) {
      qb.andWhere('status.code IN (:...lateStatusCodes)', {
        lateStatusCodes: ['SCHEDULED', 'CONFIRMED'],
      });
      qb.andWhere('appointment.starts_at < :lateThreshold', { lateThreshold });
    }

    const safeSortBy = [
      'id',
      'startsAt',
      'endsAt',
      'createdAt',
      'updatedAt',
      'statusId',
      'petId',
      'clientId',
      'veterinarianId',
    ].includes(sortBy)
      ? sortBy
      : 'startsAt';

    qb.orderBy(`appointment.${safeSortBy}`, sortDirection).addOrderBy(
      'appointment.id',
      'DESC',
    );

    qb.skip((page - 1) * limit).take(limit);
    return qb.getManyAndCount();
  }
}
