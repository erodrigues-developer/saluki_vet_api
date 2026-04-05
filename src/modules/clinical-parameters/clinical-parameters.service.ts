import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalParameter } from './entities/clinical-parameter.entity';
import { CreateClinicalParameterDto } from './dto/create-clinical-parameter.dto';
import { InpatientRecordsService } from '../inpatient-records/inpatient-records.service';

@Injectable()
export class ClinicalParametersService {
  constructor(
    @InjectRepository(ClinicalParameter)
    private readonly clinicalParametersRepository: Repository<ClinicalParameter>,
    private readonly inpatientRecordsService: InpatientRecordsService,
  ) {}

  async create(
    inpatientRecordId: number,
    payload: CreateClinicalParameterDto,
    userId?: number,
  ) {
    await this.inpatientRecordsService.ensureActiveRecord(inpatientRecordId);

    const hasAnyValue = [
      payload.temperatureC,
      payload.heartRateBpm,
      payload.respiratoryRateMpm,
      payload.bloodPressure,
      payload.weightKg,
      payload.notes,
    ].some((value) => value !== undefined && value !== null && value !== '');

    if (!hasAnyValue) {
      throw new BadRequestException(
        'At least one clinical parameter value must be provided',
      );
    }

    const entity = this.clinicalParametersRepository.create({
      ...payload,
      inpatientRecordId,
      measuredAt: payload.measuredAt ? new Date(payload.measuredAt) : new Date(),
      createdByUserId: userId ?? null,
    });

    const saved = await this.clinicalParametersRepository.save(entity);

    return this.clinicalParametersRepository.findOne({
      where: { id: saved.id },
      relations: {
        createdByUser: true,
      },
    });
  }

  async findAll(inpatientRecordId: number) {
    await this.inpatientRecordsService.ensureActiveRecord(inpatientRecordId);

    return {
      data: await this.clinicalParametersRepository.find({
        where: { inpatientRecordId },
        relations: {
          createdByUser: true,
        },
        order: {
          measuredAt: 'DESC',
          id: 'DESC',
        },
      }),
    };
  }
}
