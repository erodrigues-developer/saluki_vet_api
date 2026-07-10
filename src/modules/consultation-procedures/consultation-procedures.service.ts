import { Injectable, NotFoundException } from '@nestjs/common';
import { ConsultationProceduresRepository } from './repositories/consultation-procedures.repository';
import { ConsultationProcedure } from './entities/consultation-procedure.entity';

@Injectable()
export class ConsultationProceduresService {
  constructor(
    private readonly consultationProceduresRepository: ConsultationProceduresRepository,
  ) {}

  async create(payload: any): Promise<ConsultationProcedure> {
    const cp = this.consultationProceduresRepository.create({
      ...payload,
    } as any);
    return this.consultationProceduresRepository.save(cp as any);
  }

  async findByConsultation(
    consultationId: number,
  ): Promise<ConsultationProcedure[]> {
    return this.consultationProceduresRepository.find({
      where: { consultationId },
      order: { id: 'ASC' },
    });
  }

  async update(
    id: number,
    payload: Partial<ConsultationProcedure>,
  ): Promise<ConsultationProcedure> {
    const cp = await this.consultationProceduresRepository.findOne({
      where: { id },
    });
    if (!cp) throw new NotFoundException('Not found');

    Object.assign(cp, payload);
    return this.consultationProceduresRepository.save(cp);
  }

  async remove(id: number): Promise<void> {
    const cp = await this.consultationProceduresRepository.findOne({
      where: { id },
    });
    if (!cp) throw new NotFoundException('Not found');
    await this.consultationProceduresRepository.remove(cp);
  }
}
