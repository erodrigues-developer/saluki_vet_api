import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { Appointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  async create(payload: any): Promise<Appointment> {
    const appointment = this.appointmentsRepository.create({
      ...payload,
    } as any);
    return this.appointmentsRepository.save(appointment as any);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    petId?: number;
    clientId?: number;
    veterinarianId?: number;
    statusId?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;
    const sortBy = params.sortBy || 'startsAt';
    const sortDirection =
      params.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [data, total] = await this.appointmentsRepository.findPaginated({
      page,
      limit,
      petId: params.petId ? Number(params.petId) : undefined,
      clientId: params.clientId ? Number(params.clientId) : undefined,
      veterinarianId: params.veterinarianId
        ? Number(params.veterinarianId)
        : undefined,
      statusId: params.statusId ? Number(params.statusId) : undefined,
      sortBy,
      sortDirection,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['appointmentType', 'status'],
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }
    return appointment;
  }

  async update(id: number, payload: any): Promise<Appointment> {
    const appointment = await this.findOne(id);
    const merged = this.appointmentsRepository.merge(appointment, payload);
    return this.appointmentsRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentsRepository.softRemove(appointment);
  }
}
