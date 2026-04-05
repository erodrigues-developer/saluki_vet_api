import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentMap } from './entities/treatment-map.entity';
import { CreateTreatmentItemDto } from './dto/create-treatment-item.dto';
import { ExecuteTreatmentItemDto } from './dto/execute-treatment-item.dto';
import { Product } from '../products/entities/product.entity';
import { Procedure } from '../procedures/entities/procedure.entity';
import { InpatientRecordsService } from '../inpatient-records/inpatient-records.service';
import { FilterTreatmentMapDto } from './dto/filter-treatment-map.dto';

@Injectable()
export class TreatmentMapService {
  constructor(
    @InjectRepository(TreatmentMap)
    private readonly treatmentMapRepository: Repository<TreatmentMap>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Procedure)
    private readonly proceduresRepository: Repository<Procedure>,
    private readonly inpatientRecordsService: InpatientRecordsService,
  ) {}

  async create(
    inpatientRecordId: number,
    payload: CreateTreatmentItemDto,
  ): Promise<TreatmentMap> {
    await this.inpatientRecordsService.ensureActiveRecord(inpatientRecordId);

    if (!payload.medicamentId && !payload.procedureId) {
      throw new BadRequestException(
        'Either medicamentId or procedureId must be provided',
      );
    }

    if (payload.medicamentId) {
      const medicament = await this.productsRepository.findOneBy({
        id: payload.medicamentId,
      });
      if (!medicament || !medicament.isActive) {
        throw new NotFoundException(
          `Product ${payload.medicamentId} not found`,
        );
      }
    }

    if (payload.procedureId) {
      const procedure = await this.proceduresRepository.findOneBy({
        id: payload.procedureId,
      });
      if (!procedure || !procedure.isActive) {
        throw new NotFoundException(
          `Procedure ${payload.procedureId} not found`,
        );
      }
    }

    const entity = this.treatmentMapRepository.create({
      ...payload,
      inpatientRecordId,
      scheduledAt: new Date(payload.scheduledAt),
      status: 'PENDING',
    });

    const saved = await this.treatmentMapRepository.save(entity);
    return this.findOne(saved.id);
  }

  async findAll(inpatientRecordId: number, filters: FilterTreatmentMapDto) {
    await this.inpatientRecordsService.ensureActiveRecord(inpatientRecordId);

    const where: Record<string, any> = { inpatientRecordId };
    if (filters.status) {
      where.status = filters.status;
    }

    return {
      data: await this.treatmentMapRepository.find({
        where,
        relations: {
          medicament: true,
          procedure: true,
          executedByUser: true,
        },
        order: {
          scheduledAt: 'ASC',
          id: 'ASC',
        },
      }),
    };
  }

  async findOne(id: number) {
    const item = await this.treatmentMapRepository.findOne({
      where: { id },
      relations: {
        medicament: true,
        procedure: true,
        executedByUser: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Treatment item ${id} not found`);
    }

    return item;
  }

  async execute(
    id: number,
    payload: ExecuteTreatmentItemDto,
    userId?: number,
  ) {
    const item = await this.findOne(id);
    await this.inpatientRecordsService.ensureActiveRecord(item.inpatientRecordId);

    if (item.status === 'EXECUTED') {
      throw new BadRequestException(`Treatment item ${id} already executed`);
    }

    item.status = 'EXECUTED';
    item.executedAt = payload.executedAt
      ? new Date(payload.executedAt)
      : new Date();
    item.executedByUserId = userId ?? null;

    if (payload.notes) {
      item.notes = item.notes
        ? `${item.notes}\n\nExecucao: ${payload.notes}`
        : payload.notes;
    }

    const saved = await this.treatmentMapRepository.save(item);
    return this.findOne(saved.id);
  }
}
