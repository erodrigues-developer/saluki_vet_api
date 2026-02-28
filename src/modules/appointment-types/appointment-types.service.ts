import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentTypesRepository } from './repositories/appointment-types.repository';
import { AppointmentType } from './entities/appointment-type.entity';

@Injectable()
export class AppointmentTypesService {
  constructor(
    private readonly appointmentTypesRepository: AppointmentTypesRepository,
  ) {}

  async create(payload: any): Promise<AppointmentType> {
    const type = this.appointmentTypesRepository.create(payload as any);
    return this.appointmentTypesRepository.save(type as any);
  }

  async findAll(): Promise<AppointmentType[]> {
    return this.appointmentTypesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<AppointmentType> {
    const type = await this.appointmentTypesRepository.findOne({
      where: { id },
    });
    if (!type) {
      throw new NotFoundException(`AppointmentType ${id} not found`);
    }
    return type;
  }

  async update(id: number, payload: any): Promise<AppointmentType> {
    const type = await this.findOne(id);
    const merged = this.appointmentTypesRepository.merge(type, payload);
    return this.appointmentTypesRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const type = await this.findOne(id);
    await this.appointmentTypesRepository.remove(type);
  }
}
