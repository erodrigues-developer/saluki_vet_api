import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Box } from './entities/box.entity';
import { InpatientRecord } from '../inpatient-records/entities/inpatient-record.entity';
import { FilterBoxesDto } from './dto/filter-boxes.dto';
import { CreateBoxDto } from './dto/create-box.dto';
import { UpdateBoxDto } from './dto/update-box.dto';

@Injectable()
export class BoxesService {
  constructor(
    @InjectRepository(Box)
    private readonly boxesRepository: Repository<Box>,
    @InjectRepository(InpatientRecord)
    private readonly inpatientRecordsRepository: Repository<InpatientRecord>,
  ) {}

  async create(payload: CreateBoxDto): Promise<Box> {
    await this.ensureUniqueName(payload.name);
    const box = this.boxesRepository.create({
      ...payload,
      description: payload.description?.trim() || null,
      isActive: payload.isActive ?? true,
      name: payload.name.trim(),
    });
    const saved = await this.boxesRepository.save(box);
    return this.findOne(saved.id);
  }

  async findAll(filters: FilterBoxesDto) {
    const usePagination =
      filters.page !== undefined || filters.limit !== undefined;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    if (usePagination && (page < 1 || limit < 1)) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    const query = this.boxesRepository.createQueryBuilder('box');

    if (typeof filters.isActive === 'boolean') {
      query.andWhere('box.is_active = :isActive', { isActive: filters.isActive });
    }

    if (filters.name?.trim()) {
      query.andWhere('(box.name ILIKE :term OR box.description ILIKE :term)', {
        term: `%${filters.name.trim()}%`,
      });
    }

    const sortByMap = {
      name: 'box.name',
      isActive: 'box.is_active',
      createdAt: 'box.created_at',
      updatedAt: 'box.updated_at',
    } as const;

    const sortBy = filters.sortBy ? sortByMap[filters.sortBy] : 'box.name';
    const defaultDirection = filters.sortBy ? 'DESC' : 'ASC';
    const sortDirection =
      filters.sortDirection?.toLowerCase() === 'asc'
        ? 'ASC'
        : filters.sortDirection?.toLowerCase() === 'desc'
          ? 'DESC'
          : defaultDirection;
    query.orderBy(sortBy, sortDirection).addOrderBy('box.name', 'ASC');

    const boxes = await query.getMany();

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

    const decorated = boxes
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
      )
      .filter((box) =>
        filters.occupancyStatus ? box.occupancyStatus === filters.occupancyStatus : true,
      );

    if (!usePagination) {
      return {
        data: decorated,
      };
    }

    const start = (page - 1) * limit;
    const data = decorated.slice(start, start + limit);

    return {
      data,
      meta: {
        total: decorated.length,
        page,
        limit,
      },
    };
  }

  async findOne(id: number): Promise<Box> {
    const box = await this.boxesRepository.findOne({ where: { id } });
    if (!box) {
      throw new NotFoundException(`Box ${id} not found`);
    }
    return box;
  }

  async update(id: number, payload: UpdateBoxDto): Promise<Box> {
    const box = await this.findOne(id);

    if (payload.name && payload.name.trim().toLowerCase() !== box.name.trim().toLowerCase()) {
      await this.ensureUniqueName(payload.name, id);
    }

    const merged = this.boxesRepository.merge(box, {
      ...payload,
      name: payload.name?.trim() ?? box.name,
      description:
        payload.description !== undefined
          ? payload.description?.trim() || null
          : box.description,
    });
    const saved = await this.boxesRepository.save(merged);
    return this.findOne(saved.id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    const linkedAdmissions = await this.inpatientRecordsRepository.count({
      where: { boxId: id },
    });

    if (linkedAdmissions > 0) {
      throw new BadRequestException(
        'Este box possui internações vinculadas. Inative o cadastro em vez de excluir.',
      );
    }

    await this.boxesRepository.delete(id);
  }

  private async ensureUniqueName(name: string, ignoreId?: number) {
    const normalized = name.trim();
    const existing = await this.boxesRepository
      .createQueryBuilder('box')
      .where('LOWER(box.name) = LOWER(:name)', { name: normalized })
      .getOne();

    if (existing && Number(existing.id) !== Number(ignoreId)) {
      throw new BadRequestException('Já existe um box com este nome.');
    }
  }
}
