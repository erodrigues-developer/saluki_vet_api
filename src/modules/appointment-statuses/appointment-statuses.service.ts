import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AppointmentStatusesRepository } from './repositories/appointment-statuses.repository';
import { AppointmentStatus } from './entities/appointment-status.entity';

@Injectable()
export class AppointmentStatusesService {
  constructor(
    private readonly appointmentStatusesRepository: AppointmentStatusesRepository,
  ) {}

  async create(payload: any): Promise<AppointmentStatus> {
    await this.validatePayload(payload);
    const status = this.appointmentStatusesRepository.create({
      ...payload,
      code: this.normalizeCode(payload.code),
      name: String(payload.name || '').trim(),
      isSystem: false,
    } as any);
    return this.appointmentStatusesRepository.save(status as any);
  }

  async findAll(): Promise<AppointmentStatus[]> {
    return this.appointmentStatusesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<AppointmentStatus> {
    const status = await this.appointmentStatusesRepository.findOne({
      where: { id },
    });
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
    const linkedAppointments = await this.appointmentStatusesRepository.manager
      .createQueryBuilder()
      .from('appointments', 'appointments')
      .where('appointments.status_id = :statusId', { statusId: id })
      .getCount();
    if (linkedAppointments > 0) {
      throw new BadRequestException(
        'Não é possível excluir status vinculados a agendamentos. Você pode inativá-lo, se aplicável.',
      );
    }
    await this.appointmentStatusesRepository.remove(status);
  }

  async update(id: number, payload: any): Promise<AppointmentStatus> {
    const status = await this.findOne(id);
    if (status.isSystem) {
      throw new BadRequestException(
        'Status nativo do sistema não pode ser editado.',
      );
    }

    await this.validatePayload(payload, id);
    const merged = this.appointmentStatusesRepository.merge(status, {
      name: payload.name !== undefined ? String(payload.name || '').trim() : undefined,
      code:
        payload.code !== undefined
          ? this.normalizeCode(payload.code)
          : undefined,
    });
    return this.appointmentStatusesRepository.save(merged);
  }

  private normalizeCode(value: unknown) {
    return String(value || '')
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '')
      .trim();
  }

  private async validatePayload(payload: any, ignoreId?: number) {
    if (payload.name !== undefined && !String(payload.name || '').trim()) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    if (payload.code !== undefined) {
      const code = this.normalizeCode(payload.code);
      if (!code) {
        throw new BadRequestException('Código é obrigatório.');
      }
      if (!/^[A-Z0-9_]+$/.test(code)) {
        throw new BadRequestException(
          'Código deve conter apenas letras maiúsculas, números e underline.',
        );
      }

      const qb = this.appointmentStatusesRepository
        .createQueryBuilder('status')
        .where('UPPER(status.code) = :code', { code });
      if (ignoreId) qb.andWhere('status.id != :id', { id: ignoreId });

      const existing = await qb.getOne();
      if (existing) {
        throw new ConflictException('Código já cadastrado.');
      }
    }
  }
}
