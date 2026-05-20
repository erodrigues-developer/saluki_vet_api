import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VeterinarianWeeklyAvailability } from './entities/veterinarian-weekly-availability.entity';
import { VeterinarianAvailabilityBlock } from './entities/veterinarian-availability-block.entity';
import { VeterinarianAbsence } from './entities/veterinarian-absence.entity';

@Injectable()
export class VeterinarianAvailabilityService {
  constructor(
    @InjectRepository(VeterinarianWeeklyAvailability)
    private readonly weeklyRepository: Repository<VeterinarianWeeklyAvailability>,
    @InjectRepository(VeterinarianAvailabilityBlock)
    private readonly blockRepository: Repository<VeterinarianAvailabilityBlock>,
    @InjectRepository(VeterinarianAbsence)
    private readonly absenceRepository: Repository<VeterinarianAbsence>,
  ) {}

  async getByVeterinarian(veterinarianId: number) {
    const [weeklySchedule, blocks, absences] = await Promise.all([
      this.weeklyRepository.find({ where: { veterinarianId }, order: { weekday: 'ASC' } }),
      this.blockRepository.find({ where: { veterinarianId }, order: { date: 'DESC', startTime: 'ASC' } }),
      this.absenceRepository.find({ where: { veterinarianId }, order: { startDate: 'DESC' } }),
    ]);

    const byWeekday = new Map<number, VeterinarianWeeklyAvailability>();
    weeklySchedule.forEach((row) => byWeekday.set(Number(row.weekday), row));
    const normalized = Array.from({ length: 7 }, (_v, weekday) => {
      const found = byWeekday.get(weekday);
      if (found) return found;
      return {
        id: null,
        veterinarianId,
        weekday,
        isAvailable: false,
        periods: [],
      };
    });

    return {
      weeklySchedule: normalized,
      oneTimeBlocks: blocks,
      absences,
    };
  }

  async upsertWeeklySchedule(veterinarianId: number, payload: { days: Array<{ weekday: number; isAvailable: boolean; periods?: Array<{ startTime: string; endTime: string }> }> }) {
    const days = Array.isArray(payload?.days) ? payload.days : [];
    if (!days.length) throw new BadRequestException('Lista de dias obrigatoria.');

    const current = await this.weeklyRepository.find({ where: { veterinarianId } });
    const currentByDay = new Map<number, VeterinarianWeeklyAvailability>();
    current.forEach((row) => currentByDay.set(Number(row.weekday), row));

    const entities: VeterinarianWeeklyAvailability[] = [];
    for (const day of days) {
      const weekday = Number(day.weekday);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
        throw new BadRequestException('Dia da semana invalido. Use 0 a 6.');
      }

      const isAvailable = Boolean(day.isAvailable);
      const periods = this.normalizePeriods(day.periods || [], isAvailable);
      const found = currentByDay.get(weekday);
      const entity = found
        ? this.weeklyRepository.merge(found, { isAvailable, periods })
        : this.weeklyRepository.create({ veterinarianId, weekday, isAvailable, periods });
      entities.push(entity);
    }

    await this.weeklyRepository.save(entities);
    return this.getByVeterinarian(veterinarianId);
  }

  async createBlock(veterinarianId: number, payload: any) {
    this.assertDate(payload?.date, 'Data obrigatoria.');
    this.assertTimeRange(payload?.startTime, payload?.endTime);
    if (!String(payload?.reason || '').trim()) {
      throw new BadRequestException('Motivo obrigatorio.');
    }

    const block = this.blockRepository.create({
      veterinarianId,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      reason: String(payload.reason).trim(),
      notes: payload.notes || null,
      active: payload.active !== false,
    });
    return this.blockRepository.save(block);
  }

  async updateBlock(veterinarianId: number, id: number, payload: any) {
    const block = await this.blockRepository.findOne({ where: { id, veterinarianId } });
    if (!block) throw new NotFoundException('Bloqueio nao encontrado.');

    const next = this.blockRepository.merge(block, {
      date: payload?.date ?? block.date,
      startTime: payload?.startTime ?? block.startTime,
      endTime: payload?.endTime ?? block.endTime,
      reason: payload?.reason ?? block.reason,
      notes: payload?.notes ?? block.notes,
      active: payload?.active ?? block.active,
    });

    this.assertDate(next.date, 'Data obrigatoria.');
    this.assertTimeRange(next.startTime, next.endTime);
    if (!String(next.reason || '').trim()) {
      throw new BadRequestException('Motivo obrigatorio.');
    }

    return this.blockRepository.save(next);
  }

  async createAbsence(veterinarianId: number, payload: any) {
    this.assertDate(payload?.startDate, 'Data inicial obrigatoria.');
    this.assertDate(payload?.endDate, 'Data final obrigatoria.');
    if (!String(payload?.reason || '').trim()) {
      throw new BadRequestException('Motivo obrigatorio.');
    }
    if (payload.startDate > payload.endDate) {
      throw new BadRequestException('Data inicial deve ser menor ou igual a data final.');
    }

    const absence = this.absenceRepository.create({
      veterinarianId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      reason: String(payload.reason).trim(),
      notes: payload.notes || null,
      active: payload.active !== false,
    });
    return this.absenceRepository.save(absence);
  }

  async updateAbsence(veterinarianId: number, id: number, payload: any) {
    const absence = await this.absenceRepository.findOne({ where: { id, veterinarianId } });
    if (!absence) throw new NotFoundException('Ausencia nao encontrada.');

    const next = this.absenceRepository.merge(absence, {
      startDate: payload?.startDate ?? absence.startDate,
      endDate: payload?.endDate ?? absence.endDate,
      reason: payload?.reason ?? absence.reason,
      notes: payload?.notes ?? absence.notes,
      active: payload?.active ?? absence.active,
    });

    this.assertDate(next.startDate, 'Data inicial obrigatoria.');
    this.assertDate(next.endDate, 'Data final obrigatoria.');
    if (next.startDate > next.endDate) {
      throw new BadRequestException('Data inicial deve ser menor ou igual a data final.');
    }
    if (!String(next.reason || '').trim()) {
      throw new BadRequestException('Motivo obrigatorio.');
    }

    return this.absenceRepository.save(next);
  }

  async removeBlock(veterinarianId: number, id: number) {
    const block = await this.blockRepository.findOne({ where: { id, veterinarianId } });
    if (!block) throw new NotFoundException('Bloqueio nao encontrado.');
    await this.blockRepository.remove(block);
  }

  async removeAbsence(veterinarianId: number, id: number) {
    const absence = await this.absenceRepository.findOne({ where: { id, veterinarianId } });
    if (!absence) throw new NotFoundException('Ausencia nao encontrada.');
    await this.absenceRepository.remove(absence);
  }

  async assertAvailableForAppointment(params: { veterinarianId: number; startsAt: Date; endsAt: Date }) {
    const { veterinarianId, startsAt, endsAt } = params;
    const weekday = startsAt.getDay();
    const startDate = this.toDateString(startsAt);
    const endDate = this.toDateString(endsAt);
    const startMinutes = startsAt.getHours() * 60 + startsAt.getMinutes();
    const endMinutes = endsAt.getHours() * 60 + endsAt.getMinutes();

    const [daySchedule, blocks, absences] = await Promise.all([
      this.weeklyRepository.findOne({ where: { veterinarianId, weekday } }),
      this.blockRepository.find({ where: { veterinarianId, date: startDate, active: true } }),
      this.absenceRepository
        .createQueryBuilder('absence')
        .where('absence.veterinarian_id = :veterinarianId', { veterinarianId })
        .andWhere('absence.active = true')
        .andWhere('absence.start_date <= :endDate', { endDate })
        .andWhere('absence.end_date >= :startDate', { startDate })
        .getMany(),
    ]);

    if (!daySchedule || !daySchedule.isAvailable) {
      throw new BadRequestException('Este horario esta fora da escala do veterinario.');
    }

    const periods = this.normalizePeriods(daySchedule.periods || [], true);
    const inPeriod = periods.some((period) => {
      const periodStart = this.timeToMinutes(period.startTime);
      const periodEnd = this.timeToMinutes(period.endTime);
      return startMinutes >= periodStart && endMinutes <= periodEnd;
    });
    if (!inPeriod) {
      throw new BadRequestException('Este horario esta fora da escala do veterinario.');
    }

    const hasAbsence = absences.some((absence) => startDate >= absence.startDate && startDate <= absence.endDate);
    if (hasAbsence) {
      const absence = absences.find((row) => startDate >= row.startDate && startDate <= row.endDate);
      throw new BadRequestException(`Veterinario ausente nesta data${absence?.reason ? `: ${absence.reason}` : '.'}`);
    }

    const blocking = blocks.find((block) => {
      const blockStart = this.timeToMinutes(block.startTime);
      const blockEnd = this.timeToMinutes(block.endTime);
      return startMinutes < blockEnd && endMinutes > blockStart;
    });
    if (blocking) {
      throw new BadRequestException(`Este horario esta bloqueado: ${blocking.reason}.`);
    }
  }

  private toDateString(value: Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private assertDate(value: string, message: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
      throw new BadRequestException(message);
    }
  }

  private assertTimeRange(startTime: string, endTime: string) {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    if (end <= start) {
      throw new BadRequestException('Hora inicial deve ser menor que hora final.');
    }
  }

  private normalizePeriods(periods: Array<{ startTime: string; endTime: string }>, isAvailable: boolean) {
    if (!isAvailable) return [];
    const normalized = periods
      .map((period) => ({
        startTime: String(period?.startTime || ''),
        endTime: String(period?.endTime || ''),
      }))
      .filter((period) => period.startTime && period.endTime);

    const withMinutes = normalized.map((period) => {
      const start = this.timeToMinutes(period.startTime);
      const end = this.timeToMinutes(period.endTime);
      if (end <= start) {
        throw new BadRequestException('Horario inicial deve ser menor que horario final.');
      }
      return { ...period, start, end };
    });

    withMinutes.sort((a, b) => a.start - b.start);
    for (let i = 1; i < withMinutes.length; i += 1) {
      if (withMinutes[i].start < withMinutes[i - 1].end) {
        throw new BadRequestException('Periodos da escala nao podem se sobrepor.');
      }
    }

    return withMinutes.map((period) => ({
      startTime: period.startTime,
      endTime: period.endTime,
    }));
  }

  private timeToMinutes(value: string) {
    const match = String(value || '').match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      throw new BadRequestException('Horario invalido. Use HH:mm.');
    }
    return Number(match[1]) * 60 + Number(match[2]);
  }
}
