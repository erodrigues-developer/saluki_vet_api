import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExamType } from './entities/exam-type.entity';
import { ExamTypesRepository } from './repositories/exam-types.repository';
import { CreateExamTypeDto } from './dto/create-exam-type.dto';
import { UpdateExamTypeDto } from './dto/update-exam-type.dto';
import { FilterExamTypesDto } from './dto/filter-exam-types.dto';

@Injectable()
export class ExamTypesService {
  constructor(private readonly examTypesRepository: ExamTypesRepository) {}

  async create(payload: CreateExamTypeDto): Promise<ExamType> {
    await this.ensureUniqueName(payload.name);
    const examType = this.examTypesRepository.create({
      ...payload,
      isActive: payload.isActive ?? true,
    });
    return this.examTypesRepository.save(examType);
  }

  async findAll(filters: FilterExamTypesDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    const [data, total] = await this.examTypesRepository.findPaginated({
      page,
      limit,
      name: filters.name,
      isActive:
        typeof filters.isActive === 'boolean' ? filters.isActive : undefined,
      examCategoryId: filters.examCategoryId,
      sortBy: filters.sortBy || 'updatedAt',
      sortDirection:
        filters.sortDirection?.toLowerCase() === 'asc' ? 'ASC' : 'DESC',
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

  async findOne(id: number): Promise<ExamType> {
    const examType = await this.examTypesRepository.findOne({
      where: { id },
      relations: { examCategory: true },
    });
    if (!examType) {
      throw new NotFoundException(`ExamType ${id} not found`);
    }
    return examType;
  }

  async update(id: number, payload: UpdateExamTypeDto): Promise<ExamType> {
    const examType = await this.findOne(id);
    if (payload.name !== undefined) {
      await this.ensureUniqueName(payload.name, id);
    }
    const merged = this.examTypesRepository.merge(examType, payload);
    return this.examTypesRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const examType = await this.findOne(id);
    await this.examTypesRepository.remove(examType);
  }

  private async ensureUniqueName(name: string, ignoreId?: number) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;

    const qb = this.examTypesRepository
      .createQueryBuilder('examType')
      .where('LOWER(TRIM(examType.name)) = LOWER(TRIM(:name))', {
        name: trimmed,
      });

    if (ignoreId) {
      qb.andWhere('examType.id != :ignoreId', { ignoreId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException('Já existe um tipo de exame com esse nome.');
    }
  }
}
