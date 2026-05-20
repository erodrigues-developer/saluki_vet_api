import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { Appointment } from './entities/appointment.entity';
import { DataSource } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { Pet } from '../pets/entities/pet.entity';
import { AppointmentStatus } from '../appointment-statuses/entities/appointment-status.entity';
import { ClinicSettingsService } from '../clinic-settings/clinic-settings.service';
import { VeterinarianAvailabilityService } from '../veterinarian-availability/veterinarian-availability.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly dataSource: DataSource,
    private readonly clinicSettingsService: ClinicSettingsService,
    private readonly veterinarianAvailabilityService: VeterinarianAvailabilityService,
  ) {}

  async create(payload: any): Promise<Appointment> {
    const startsAt = payload?.startsAt ? new Date(payload.startsAt) : new Date();
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Data do agendamento invalida.');
    }
    const endsAt = payload?.endsAt
      ? new Date(payload.endsAt)
      : new Date(startsAt.getTime() + 30 * 60 * 1000);
    if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw new BadRequestException(
        'Horario de termino invalido para o agendamento.',
      );
    }
    await this.ensureNoVeterinarianConflict({
      veterinarianId: payload?.veterinarianId ?? null,
      startsAt,
      endsAt,
    });
    await this.ensureVeterinarianAvailability({
      veterinarianId: payload?.veterinarianId ?? null,
      startsAt,
      endsAt,
    });

    const appointment = this.appointmentsRepository.create({
      ...payload,
      startsAt,
      endsAt,
    } as any);
    const saved = await this.appointmentsRepository.save(appointment as any);
    return this.findOne(saved.id);
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
        throw new BadRequestException(
          'Nome e especie do pet sao obrigatorios.',
        );
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
      if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
        throw new BadRequestException(
          'Horario de termino invalido para o agendamento.',
        );
      }
      await this.ensureNoVeterinarianConflict({
        veterinarianId: appointmentPayload.veterinarianId
          ? Number(appointmentPayload.veterinarianId)
          : null,
        startsAt,
        endsAt,
        manager,
      });
      await this.ensureVeterinarianAvailability({
        veterinarianId: appointmentPayload.veterinarianId
          ? Number(appointmentPayload.veterinarianId)
          : null,
        startsAt,
        endsAt,
      });

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

  async checkIn(
    id: number,
    payload: any,
    currentUserId?: number,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);
    const arrivedStatus = await this.dataSource
      .getRepository(AppointmentStatus)
      .findOne({ where: { code: 'ARRIVED' } });
    if (!arrivedStatus) {
      throw new BadRequestException('Status ARRIVED nao configurado.');
    }
    const statusCode = String(appointment.status?.code || '').toUpperCase();
    if (statusCode === 'CANCELED' || statusCode === 'COMPLETED') {
      throw new BadRequestException(
        'Nao e possivel fazer check-in em agendamento cancelado ou finalizado.',
      );
    }

    const businessTimeZone = await this.resolveBusinessTimeZone();
    if (!this.isSameLocalDate(appointment.startsAt, new Date(), businessTimeZone)) {
      throw new BadRequestException(
        'Check-in permitido apenas no dia do agendamento.',
      );
    }

    const reason = payload.reason ?? appointment.reason ?? '';
    const triage = this.resolveCheckInTriage(payload, reason);

    appointment.statusId = arrivedStatus.id;
    appointment.status = arrivedStatus;
    appointment.reason = reason;
    appointment.arrivedAt = new Date();
    appointment.checkedInByUserId = currentUserId ?? null;
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
    late?: boolean | string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;
    const sortBy = params.sortBy || 'startsAt';
    const sortDirection =
      params.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const timezone = await this.resolveBusinessTimeZone();
    const settings = await this.clinicSettingsService.getSettings();
    const toleranceMinutes = this.resolveLateToleranceMinutes(
      settings?.checkInToleranceMinutes,
    );
    const now = new Date();
    const lateThreshold = new Date(now.getTime() - toleranceMinutes * 60 * 1000);
    const lateOnly = this.toBoolean(params.late);

    const [data, total] = await this.appointmentsRepository.findPaginated({
      page,
      limit,
      petId: params.petId ? Number(params.petId) : undefined,
      clientId: params.clientId ? Number(params.clientId) : undefined,
      veterinarianId: params.veterinarianId
        ? Number(params.veterinarianId)
        : undefined,
      statusId: params.statusId ? Number(params.statusId) : undefined,
      lateOnly,
      lateThreshold,
      sortBy,
      sortDirection,
    });

    const dataWithDerived = data.map((item) =>
      this.withDerivedState(item, {
        now,
        timeZone: timezone,
        toleranceMinutes,
      }),
    );

    return {
      data: dataWithDerived,
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
    const timezone = await this.resolveBusinessTimeZone();
    const settings = await this.clinicSettingsService.getSettings();
    const toleranceMinutes = this.resolveLateToleranceMinutes(
      settings?.checkInToleranceMinutes,
    );
    return this.withDerivedState(appointment, {
      now: new Date(),
      timeZone: timezone,
      toleranceMinutes,
    });
  }

  async update(id: number, payload: any): Promise<Appointment> {
    const appointment = await this.findOne(id);
    const startsAt = payload?.startsAt
      ? new Date(payload.startsAt)
      : new Date(appointment.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Data do agendamento invalida.');
    }
    const endsAt = payload?.endsAt
      ? new Date(payload.endsAt)
      : appointment.endsAt
        ? new Date(appointment.endsAt)
        : new Date(startsAt.getTime() + 30 * 60 * 1000);
    if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw new BadRequestException(
        'Horario de termino invalido para o agendamento.',
      );
    }
    const veterinarianId =
      payload?.veterinarianId !== undefined
        ? payload.veterinarianId
        : appointment.veterinarianId;
    await this.ensureNoVeterinarianConflict({
      veterinarianId,
      startsAt,
      endsAt,
      excludeAppointmentId: id,
    });
    await this.ensureVeterinarianAvailability({
      veterinarianId,
      startsAt,
      endsAt,
    });

    const requestedStatusId =
      payload?.statusId !== undefined && payload?.statusId !== null
        ? Number(payload.statusId)
        : null;
    if (requestedStatusId && requestedStatusId !== Number(appointment.statusId)) {
      const requestedStatus = await this.dataSource
        .getRepository(AppointmentStatus)
        .findOne({ where: { id: requestedStatusId } });
      if (!requestedStatus) {
        throw new BadRequestException('Status de agendamento invalido.');
      }

      if (this.isNoShowCode(requestedStatus.code)) {
        const settings = await this.clinicSettingsService.getSettings();
        const toleranceMinutes = this.resolveLateToleranceMinutes(
          settings?.checkInToleranceMinutes,
        );
        this.assertNoShowAllowed(appointment, toleranceMinutes, new Date());
      }
    }

    const merged = this.appointmentsRepository.merge(appointment, {
      ...payload,
      startsAt,
      endsAt,
    });
    if (payload?.statusId !== undefined) {
      // Evita que a relação carregada anteriormente sobrescreva o statusId novo.
      (merged as any).status = undefined;
    }
    const saved = await this.appointmentsRepository.save(merged);
    return this.findOne(saved.id);
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
      return {
        risk: 'VERMELHA',
        score: 90,
        notes: 'Sinais de urgencia detectados.',
      };
    }
    if (yellow.some((term) => text.includes(term))) {
      return {
        risk: 'AMARELA',
        score: 60,
        notes: 'Sintomas requerem prioridade intermediaria.',
      };
    }
    return {
      risk: 'VERDE',
      score: 20,
      notes: 'Sem sinais criticos no texto informado.',
    };
  }

  private resolveCheckInTriage(payload: any, reason: string) {
    const selectedRisk = this.normalizeRisk(payload?.triageRisk);
    if (selectedRisk) {
      const vitalsNotes = this.buildTriageVitalsNotes(payload);
      const scoreByRisk: Record<string, number> = {
        VERDE: 20,
        AMARELA: 60,
        VERMELHA: 90,
        EMERGENCY: 100,
      };
      return {
        risk: selectedRisk,
        score: scoreByRisk[selectedRisk] ?? 20,
        notes:
          vitalsNotes ||
          `Triagem definida manualmente no check-in (${selectedRisk}).`,
      };
    }

    return this.classifyTriage(reason);
  }

  private normalizeRisk(raw: any): string | null {
    const value = String(raw || '')
      .trim()
      .toUpperCase();
    if (!value || value === 'PENDING' || value === 'NOT_TRIAGED') return null;
    if (['VERDE', 'GREEN'].includes(value)) return 'VERDE';
    if (['AMARELA', 'YELLOW'].includes(value)) return 'AMARELA';
    if (['VERMELHA', 'RED'].includes(value)) return 'VERMELHA';
    if (value === 'EMERGENCY') return 'EMERGENCY';
    return null;
  }

  private buildTriageVitalsNotes(payload: any): string {
    const fields: Array<[string, string]> = [];
    const add = (label: string, value: any) => {
      if (value === undefined || value === null) return;
      const text = String(value).trim();
      if (!text) return;
      fields.push([label, text]);
    };

    add('Motivo/Queixa', payload?.reason);
    add('Peso (kg)', payload?.weightKg);
    add('Temperatura (°C)', payload?.temperatureC);
    add('Frequência cardíaca (bpm)', payload?.heartRateBpm);
    add('Frequência respiratória (irpm)', payload?.respiratoryRateIpm);
    add('Mucosas', payload?.mucosaStatus);
    add('Hidratação', payload?.hydrationStatus);
    add('Dor', payload?.painStatus);

    if (!fields.length) return '';
    return fields.map(([label, value]) => `${label}: ${value}`).join(' | ');
  }

  private isSameLocalDate(a: Date, b: Date, timeZone: string): boolean {
    return (
      this.toDateKeyInTimeZone(a, timeZone) ===
      this.toDateKeyInTimeZone(b, timeZone)
    );
  }

  private toDateKeyInTimeZone(date: Date, timeZone: string): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  }

  private async resolveBusinessTimeZone(): Promise<string> {
    try {
      const timezone = await this.clinicSettingsService.getBusinessTimezone();
      if (timezone) return timezone;
    } catch {
      // Fallback mantém o fluxo mesmo se configurações estiverem indisponíveis.
    }
    return process.env.CLINIC_TIMEZONE || 'America/Sao_Paulo';
  }

  private resolveLateToleranceMinutes(raw: any): number {
    const value = Number(raw);
    if (!Number.isFinite(value)) return 10;
    if (value < 0) return 0;
    return Math.floor(value);
  }

  private toBoolean(raw: unknown): boolean {
    if (typeof raw === 'boolean') return raw;
    const value = String(raw || '')
      .trim()
      .toLowerCase();
    return ['1', 'true', 'yes', 'sim'].includes(value);
  }

  private isNoShowCode(code?: string | null): boolean {
    const normalized = String(code || '')
      .trim()
      .toUpperCase();
    return ['NO_SHOW', 'NOSHOW'].includes(normalized);
  }

  private assertNoShowAllowed(
    appointment: Appointment,
    toleranceMinutes: number,
    now: Date,
  ) {
    const statusCode = String(appointment.status?.code || '').toUpperCase();
    if (!['SCHEDULED', 'CONFIRMED'].includes(statusCode)) {
      throw new BadRequestException(
        'Não compareceu só pode ser marcado para agendamentos agendados ou confirmados.',
      );
    }

    const startsAtTs = new Date(appointment.startsAt).getTime();
    const noShowCutoffTs = startsAtTs + toleranceMinutes * 60 * 1000;
    if (now.getTime() <= noShowCutoffTs) {
      throw new BadRequestException(
        `Não compareceu só pode ser marcado após o horário do agendamento + tolerância de ${toleranceMinutes} min.`,
      );
    }
  }

  private withDerivedState(
    appointment: Appointment,
    context: { now: Date; timeZone: string; toleranceMinutes: number },
  ): Appointment {
    const statusCode = String(appointment.status?.code || '').toUpperCase();
    const isLateEligible = ['SCHEDULED', 'CONFIRMED'].includes(statusCode);
    const thresholdTs =
      new Date(appointment.startsAt).getTime() + context.toleranceMinutes * 60 * 1000;
    const lateByMinutesRaw = Math.floor(
      (context.now.getTime() - thresholdTs) / 60000,
    );
    const isLate = isLateEligible && lateByMinutesRaw > 0;

    (appointment as any).derived = {
      isLate,
      lateByMinutes: isLate ? lateByMinutesRaw : 0,
      lateSince: isLate ? new Date(thresholdTs).toISOString() : null,
      timeZone: context.timeZone,
      toleranceMinutes: context.toleranceMinutes,
    };
    return appointment;
  }

  private async ensureNoVeterinarianConflict(params: {
    veterinarianId?: number | null;
    startsAt: Date;
    endsAt: Date;
    excludeAppointmentId?: number;
    manager?: any;
  }) {
    const veterinarianId =
      params.veterinarianId === null || params.veterinarianId === undefined
        ? null
        : Number(params.veterinarianId);
    if (!veterinarianId) return;

    const qb = (params.manager ?? this.dataSource)
      .createQueryBuilder(Appointment, 'appointment')
      .leftJoin('appointment.status', 'status')
      .where('appointment.veterinarian_id = :veterinarianId', {
        veterinarianId,
      })
      .andWhere(
        '(status.code IS NULL OR status.code NOT IN (:...blockedStatusCodes))',
        {
          blockedStatusCodes: ['CANCELED', 'NO_SHOW'],
        },
      )
      .andWhere(
        'appointment.starts_at < :newEndsAt AND COALESCE(appointment.ends_at, appointment.starts_at + INTERVAL \'30 minutes\') > :newStartsAt',
        {
          newStartsAt: params.startsAt,
          newEndsAt: params.endsAt,
        },
      );

    if (params.excludeAppointmentId) {
      qb.andWhere('appointment.id != :excludeAppointmentId', {
        excludeAppointmentId: params.excludeAppointmentId,
      });
    }

    const conflict = await qb.getOne();
    if (!conflict) return;

    throw new ConflictException(
      'Conflito de horario: ja existe agendamento para este veterinario no periodo informado.',
    );
  }

  private async ensureVeterinarianAvailability(params: {
    veterinarianId?: number | null;
    startsAt: Date;
    endsAt: Date;
  }) {
    const veterinarianId =
      params.veterinarianId === null || params.veterinarianId === undefined
        ? null
        : Number(params.veterinarianId);
    if (!veterinarianId) return;

    await this.veterinarianAvailabilityService.assertAvailableForAppointment({
      veterinarianId,
      startsAt: params.startsAt,
      endsAt: params.endsAt,
    });
  }
}
