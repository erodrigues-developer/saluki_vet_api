import { Injectable, NotFoundException } from '@nestjs/common';
import { ConsultationsRepository } from './repositories/consultations.repository';
import { Consultation } from './entities/consultation.entity';

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
  ) {}

  async create(payload: any): Promise<Consultation> {
    const consultation = this.consultationsRepository.create({
      ...payload,
    } as any);
    return this.consultationsRepository.save(consultation as any);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    petId?: number;
    clientId?: number;
    veterinarianId?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;
    const sortBy = params.sortBy || 'visitDate';
    const sortDirection =
      params.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [data, total] = await this.consultationsRepository.findPaginated({
      page,
      limit,
      petId: params.petId ? Number(params.petId) : undefined,
      clientId: params.clientId ? Number(params.clientId) : undefined,
      veterinarianId: params.veterinarianId
        ? Number(params.veterinarianId)
        : undefined,
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

  async findOne(id: number): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findOne({
      where: { id },
    });
    if (!consultation) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }
    return consultation;
  }

  async update(id: number, payload: any): Promise<Consultation> {
    const consultation = await this.findOne(id);
    const merged = this.consultationsRepository.merge(consultation, payload);
    return this.consultationsRepository.save(merged);
  }
}
