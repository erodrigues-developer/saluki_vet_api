import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Box } from './entities/box.entity';
import { InpatientRecord } from '../inpatient-records/entities/inpatient-record.entity';
import { FilterBoxesDto } from './dto/filter-boxes.dto';

@Injectable()
export class BoxesService {
  constructor(
    @InjectRepository(Box)
    private readonly boxesRepository: Repository<Box>,
    @InjectRepository(InpatientRecord)
    private readonly inpatientRecordsRepository: Repository<InpatientRecord>,
  ) {}

  async findAll(filters: FilterBoxesDto) {
    const boxes = await this.boxesRepository.find({
      where:
        typeof filters.isActive === 'boolean'
          ? { isActive: filters.isActive }
          : {},
      order: {
        name: 'ASC',
      },
    });

    const activeAdmissions = await this.inpatientRecordsRepository.find({
      where: {
        status: 'ACTIVE',
      },
      relations: {
        pet: true,
        box: true,
        consultation: true,
      },
      order: {
        admissionAt: 'DESC',
      },
    });

    const occupiedByBoxId = new Map<number, InpatientRecord>();
    for (const record of activeAdmissions) {
      if (!occupiedByBoxId.has(Number(record.boxId))) {
        occupiedByBoxId.set(Number(record.boxId), record);
      }
    }

    const data = boxes
      .map((box) => {
        const currentInpatient = occupiedByBoxId.get(Number(box.id)) ?? null;
        return {
          ...box,
          occupancyStatus: currentInpatient ? 'OCCUPIED' : 'AVAILABLE',
          currentInpatient,
        };
      })
      .filter((box) =>
        filters.availableOnly ? box.occupancyStatus === 'AVAILABLE' : true,
      );

    return {
      data,
    };
  }
}
