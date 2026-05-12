import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InpatientRecord } from './entities/inpatient-record.entity';
import { CreateInpatientRecordDto } from './dto/create-inpatient-record.dto';
import { Box } from '../boxes/entities/box.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { FilterInpatientRecordsDto } from './dto/filter-inpatient-records.dto';
import { ClinicalParameter } from '../clinical-parameters/entities/clinical-parameter.entity';
import { TreatmentMap } from '../treatment-map/entities/treatment-map.entity';
import { DischargeInpatientRecordDto } from './dto/discharge-inpatient-record.dto';

@Injectable()
export class InpatientRecordsService {
  constructor(
    @InjectRepository(InpatientRecord)
    private readonly inpatientRecordsRepository: Repository<InpatientRecord>,
    @InjectRepository(Box)
    private readonly boxesRepository: Repository<Box>,
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
    @InjectRepository(Consultation)
    private readonly consultationsRepository: Repository<Consultation>,
    @InjectRepository(ClinicalParameter)
    private readonly clinicalParametersRepository: Repository<ClinicalParameter>,
    @InjectRepository(TreatmentMap)
    private readonly treatmentMapRepository: Repository<TreatmentMap>,
  ) {}

  async create(payload: CreateInpatientRecordDto): Promise<InpatientRecord> {
    const pet = await this.petsRepository.findOne({
      where: { id: payload.petId },
      relations: {
        client: true,
        species: true,
        breed: true,
      },
    });

    if (!pet) {
      throw new NotFoundException(`Pet ${payload.petId} not found`);
    }

    const box = await this.boxesRepository.findOneBy({ id: payload.boxId });
    if (!box || !box.isActive) {
      throw new NotFoundException(`Box ${payload.boxId} not found`);
    }

    const activeForPet = await this.inpatientRecordsRepository.findOne({
      where: {
        petId: payload.petId,
        status: 'ACTIVE',
      },
    });
    if (activeForPet) {
      throw new BadRequestException(
        `Pet ${payload.petId} already has an active inpatient record`,
      );
    }

    const activeForBox = await this.inpatientRecordsRepository.findOne({
      where: {
        boxId: payload.boxId,
        status: 'ACTIVE',
      },
    });
    if (activeForBox) {
      throw new BadRequestException(`Box ${payload.boxId} is already occupied`);
    }

    if (payload.consultationId) {
      const consultation = await this.consultationsRepository.findOneBy({
        id: payload.consultationId,
      });
      if (!consultation) {
        throw new NotFoundException(
          `Consultation ${payload.consultationId} not found`,
        );
      }
      if (Number(consultation.petId) !== Number(payload.petId)) {
        throw new BadRequestException(
          'Consultation does not belong to the informed pet',
        );
      }
    }

    const entity = this.inpatientRecordsRepository.create({
      ...payload,
      admissionAt: payload.admissionAt
        ? new Date(payload.admissionAt)
        : new Date(),
      status: 'ACTIVE',
    });

    const saved = await this.inpatientRecordsRepository.save(entity);
    return this.findOne(saved.id);
  }

  async findAll(filters: FilterInpatientRecordsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const query = this.inpatientRecordsRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.pet', 'pet')
      .leftJoinAndSelect('pet.client', 'client')
      .leftJoinAndSelect('pet.species', 'species')
      .leftJoinAndSelect('pet.breed', 'breed')
      .leftJoinAndSelect('record.box', 'box')
      .leftJoinAndSelect('record.consultation', 'consultation');

    if (filters.status) {
      query.andWhere('record.status = :status', {
        status: filters.status,
      });
    }

    if (filters.boxId) {
      query.andWhere('record.boxId = :boxId', { boxId: filters.boxId });
    }

    if (filters.petId) {
      query.andWhere('record.petId = :petId', { petId: filters.petId });
    }

    query
      .orderBy('record.admissionAt', 'DESC')
      .addOrderBy('record.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(id: number) {
    const record = await this.inpatientRecordsRepository.findOne({
      where: { id },
      relations: {
        pet: {
          client: true,
          species: true,
          breed: true,
        },
        box: true,
        consultation: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`Inpatient record ${id} not found`);
    }

    const [latestClinicalParameters, pendingTreatments, executedTreatments] =
      await Promise.all([
        this.clinicalParametersRepository.find({
          where: { inpatientRecordId: id },
          relations: {
            createdByUser: true,
          },
          order: {
            measuredAt: 'DESC',
            id: 'DESC',
          },
          take: 5,
        }),
        this.treatmentMapRepository.count({
          where: {
            inpatientRecordId: id,
            status: 'PENDING',
          },
        }),
        this.treatmentMapRepository.count({
          where: {
            inpatientRecordId: id,
            status: 'EXECUTED',
          },
        }),
      ]);

    return {
      ...record,
      latestClinicalParameters,
      treatmentSummary: {
        pending: pendingTreatments,
        executed: executedTreatments,
      },
    };
  }

  async ensureActiveRecord(id: number): Promise<InpatientRecord> {
    const record = await this.inpatientRecordsRepository.findOne({
      where: { id },
      relations: {
        pet: true,
        box: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`Inpatient record ${id} not found`);
    }

    if (record.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Inpatient record ${id} is not active anymore`,
      );
    }

    return record;
  }

  async discharge(id: number, payload: DischargeInpatientRecordDto) {
    const record = await this.ensureActiveRecord(id);
    record.status = 'DISCHARGED';
    record.dischargeAt = payload.dischargeAt
      ? new Date(payload.dischargeAt)
      : new Date();

    if (payload.notes) {
      record.notes = record.notes
        ? `${record.notes}\n\nAlta: ${payload.notes}`
        : `Alta: ${payload.notes}`;
    }

    const saved = await this.inpatientRecordsRepository.save(record);
    return this.findOne(saved.id);
  }
}
