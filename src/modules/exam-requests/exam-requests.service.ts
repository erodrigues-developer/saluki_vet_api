import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExamRequest } from './entities/exam-request.entity';
import { CreateExamRequestDto } from './dto/create-exam-request.dto';
import { FilterExamRequestsDto } from './dto/filter-exam-requests.dto';
import { Pet } from '../pets/entities/pet.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { ExamType } from '../exam-types/entities/exam-type.entity';

@Injectable()
export class ExamRequestsService {
  constructor(
    @InjectRepository(ExamRequest)
    private readonly examRequestsRepository: Repository<ExamRequest>,
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
    @InjectRepository(Consultation)
    private readonly consultationsRepository: Repository<Consultation>,
    @InjectRepository(ExamType)
    private readonly examTypesRepository: Repository<ExamType>,
  ) {}

  async create(payload: CreateExamRequestDto) {
    const examTypeIds = Array.from(
      new Set((payload.examTypeIds || []).map((id) => Number(id)).filter(Boolean)),
    );

    if (!examTypeIds.length) {
      throw new BadRequestException('Selecione ao menos um exame para gerar o pedido.');
    }

    const pet = await this.petsRepository.findOneBy({ id: payload.petId });
    if (!pet) throw new NotFoundException(`Pet ${payload.petId} not found`);

    if (payload.consultationId) {
      const consultation = await this.consultationsRepository.findOneBy({
        id: payload.consultationId,
      });
      if (!consultation) {
        throw new NotFoundException(`Consultation ${payload.consultationId} not found`);
      }
      if (Number(consultation.petId) !== Number(payload.petId)) {
        throw new BadRequestException('A consulta informada não pertence ao paciente.');
      }
    }

    const examTypes = await this.examTypesRepository.findBy({
      id: In(examTypeIds),
    });
    const activeExamTypes = examTypes.filter((item) => item.isActive);
    if (activeExamTypes.length !== examTypeIds.length) {
      throw new BadRequestException('Um ou mais exames selecionados não estão ativos.');
    }

    const requestedAt = payload.requestedAt ? new Date(payload.requestedAt) : new Date();

    const entities = activeExamTypes.map((examType) =>
      this.examRequestsRepository.create({
        consultationId: payload.consultationId ?? null,
        petId: payload.petId,
        examTypeId: Number(examType.id),
        requestedAt,
        status: 'PENDING',
        notes: payload.notes?.trim() || null,
      }),
    );

    await this.examRequestsRepository.save(entities);
    return this.findAll({
      consultationId: payload.consultationId,
      petId: payload.petId,
    });
  }

  async findAll(filters: FilterExamRequestsDto) {
    const query = this.examRequestsRepository
      .createQueryBuilder('examRequest')
      .leftJoinAndSelect('examRequest.examType', 'examType')
      .leftJoinAndSelect('examType.examCategory', 'examCategory')
      .leftJoinAndSelect('examRequest.pet', 'pet')
      .leftJoinAndSelect('pet.client', 'client')
      .leftJoinAndSelect('examRequest.consultation', 'consultation')
      .orderBy('examRequest.requestedAt', 'DESC')
      .addOrderBy('examRequest.id', 'DESC');

    if (filters.consultationId) {
      query.andWhere('examRequest.consultationId = :consultationId', {
        consultationId: filters.consultationId,
      });
    }
    if (filters.petId) {
      query.andWhere('examRequest.petId = :petId', { petId: filters.petId });
    }
    if (filters.status) {
      query.andWhere('UPPER(examRequest.status) = :status', {
        status: String(filters.status).toUpperCase(),
      });
    }

    return { data: await query.getMany() };
  }
}
