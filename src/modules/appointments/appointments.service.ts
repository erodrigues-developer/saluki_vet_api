import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { Appointment } from './entities/appointment.entity';
import { DataSource } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { Pet } from '../pets/entities/pet.entity';
import { AppointmentStatus } from '../appointment-statuses/entities/appointment-status.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: any): Promise<Appointment> {
    const appointment = this.appointmentsRepository.create({
      ...payload,
    } as any);
    return this.appointmentsRepository.save(appointment as any);
  }

  async quickCreate(payload: any): Promise<Appointment> {
    return this.dataSource.transaction(async (manager) => {
      const status = await manager.getRepository(AppointmentStatus).findOne({
        where: { code: 'SCHEDULED' },
      });
      if (!status) {
        throw new BadRequestException('Status SCHEDULED nao configurado.');
      }

      const clientPayload = payload.client || {};
      if (!clientPayload.name) {
        throw new BadRequestException('Nome do tutor e obrigatorio.');
      }

      const client = await manager.getRepository(Client).save(
        manager.getRepository(Client).create({
          name: clientPayload.name,
          document: clientPayload.document ?? null,
          phone: clientPayload.phone ?? null,
          mobilePhone: clientPayload.mobilePhone ?? null,
          email: clientPayload.email ?? null,
          notes: clientPayload.notes ?? null,
          isActive: true,
        }),
      );

      const petPayload = payload.pet || {};
      if (!petPayload.name || !petPayload.speciesId) {
        throw new BadRequestException('Nome e especie do pet sao obrigatorios.');
      }

      const pet = await manager.getRepository(Pet).save(
        manager.getRepository(Pet).create({
          clientId: client.id,
          name: petPayload.name,
          speciesId: Number(petPayload.speciesId),
          breedId: petPayload.breedId ? Number(petPayload.breedId) : null,
          sex: petPayload.sex ?? null,
          dateOfBirth: petPayload.dateOfBirth ?? null,
          weightKg: petPayload.weightKg ?? null,
          color: petPayload.color ?? null,
          notes: petPayload.notes ?? null,
          isActive: true,
        }),
      );

      const appointmentPayload = payload.appointment || {};
      if (!appointmentPayload.appointmentTypeId) {
        throw new BadRequestException('Tipo de agendamento e obrigatorio.');
      }

      const startsAt = appointmentPayload.startsAt
        ? new Date(appointmentPayload.startsAt)
        : new Date();
      if (Number.isNaN(startsAt.getTime())) {
        throw new BadRequestException('Data do agendamento invalida.');
      }
      const endsAt = appointmentPayload.endsAt
        ? new Date(appointmentPayload.endsAt)
        : new Date(startsAt.getTime() + 30 * 60 * 1000);

      const appointment = await manager.getRepository(Appointment).save(
        manager.getRepository(Appointment).create({
          clientId: client.id,
          petId: pet.id,
          appointmentTypeId: Number(appointmentPayload.appointmentTypeId),
          statusId: status.id,
          veterinarianId: appointmentPayload.veterinarianId
            ? Number(appointmentPayload.veterinarianId)
            : null,
          startsAt,
          endsAt,
          reason: appointmentPayload.reason ?? null,
          notes: appointmentPayload.notes ?? null,
        }),
      );

      return manager.getRepository(Appointment).findOneOrFail({
        where: { id: appointment.id },
        relations: ['appointmentType', 'status'],
      });
    });
  }

  async checkIn(id: number, payload: any): Promise<Appointment> {
    const appointment = await this.findOne(id);
    const arrivedStatus = await this.dataSource
      .getRepository(AppointmentStatus)
      .findOne({ where: { code: 'ARRIVED' } });
    if (!arrivedStatus) {
      throw new BadRequestException('Status ARRIVED nao configurado.');
    }

    const reason = payload.reason ?? appointment.reason ?? '';
    const triage = this.classifyTriage(reason);

    appointment.statusId = arrivedStatus.id;
    appointment.status = arrivedStatus;
    appointment.reason = reason;
    appointment.arrivedAt = payload.arrivedAt ? new Date(payload.arrivedAt) : new Date();
    appointment.triageRisk = triage.risk;
    appointment.triageScore = triage.score;
    appointment.triageNotes = triage.notes;

    const saved = await this.appointmentsRepository.save(appointment);
    return this.findOne(saved.id);
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

  private classifyTriage(reason: string) {
    const text = reason.toLowerCase();
    const red = ['convuls', 'sangr', 'atropel', 'respira', 'desma', 'veneno'];
    const yellow = ['vomit', 'diarre', 'dor', 'febre', 'apat', 'nao come'];
    if (red.some((term) => text.includes(term))) {
      return { risk: 'VERMELHA', score: 90, notes: 'Sinais de urgencia detectados.' };
    }
    if (yellow.some((term) => text.includes(term))) {
      return { risk: 'AMARELA', score: 60, notes: 'Sintomas requerem prioridade intermediaria.' };
    }
    return { risk: 'VERDE', score: 20, notes: 'Sem sinais criticos no texto informado.' };
  }
}
