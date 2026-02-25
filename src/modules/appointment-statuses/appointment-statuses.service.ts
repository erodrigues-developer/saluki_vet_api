import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AppointmentStatusesRepository } from './repositories/appointment-statuses.repository';
import { AppointmentStatus } from './entities/appointment-status.entity';

@Injectable()
export class AppointmentStatusesService {
  constructor(
    private readonly appointmentStatusesRepository: AppointmentStatusesRepository,
  ) {}

  async create(payload: any): Promise<AppointmentStatus> {
    const status = this.appointmentStatusesRepository.create({ ...payload, isSystem: false } as any);
    return this.appointmentStatusesRepository.save(status as any);
  }

  async findAll(): Promise<AppointmentStatus[]> {
    return this.appointmentStatusesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<AppointmentStatus> {
    const status = await this.appointmentStatusesRepository.findOne({ where: { id } });
    if (!status) {
      throw new NotFoundException(`AppointmentStatus ${id} not found`);
    }
    return status;
  }

  async remove(id: number): Promise<void> {
    const status = await this.findOne(id);
    if (status.isSystem) {
      throw new BadRequestException('Cannot delete system status');
    }
    await this.appointmentStatusesRepository.remove(status);
  }
}
