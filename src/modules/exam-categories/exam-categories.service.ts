import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExamCategory } from './entities/exam-category.entity';
import { ExamCategoriesRepository } from './repositories/exam-categories.repository';
import { CreateExamCategoryDto } from './dto/create-exam-category.dto';
import { UpdateExamCategoryDto } from './dto/update-exam-category.dto';
import { FilterExamCategoriesDto } from './dto/filter-exam-categories.dto';

@Injectable()
export class ExamCategoriesService {
  constructor(
    private readonly examCategoriesRepository: ExamCategoriesRepository,
  ) {}

  async create(payload: CreateExamCategoryDto): Promise<ExamCategory> {
    await this.ensureUniqueName(payload.name);
    const category = this.examCategoriesRepository.create({
      ...payload,
      isActive: payload.isActive ?? true,
    });
    return this.examCategoriesRepository.save(category);
  }

  async findAll(filters: FilterExamCategoriesDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    const { data, total } = await this.examCategoriesRepository.findPaginated({
      name: filters.name,
      isActive:
        typeof filters.isActive === 'boolean' ? filters.isActive : undefined,
      page,
      limit,
      sortBy:
        filters.sortBy === 'createdAt'
          ? 'created_at'
          : filters.sortBy === 'updatedAt'
            ? 'updated_at'
            : filters.sortBy === 'isActive'
              ? 'is_active'
              : (filters.sortBy as any),
      sortDirection:
        filters.sortDirection?.toLowerCase() === 'asc' ? 'ASC' : 'DESC',
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: number): Promise<ExamCategory> {
    const category = await this.examCategoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`ExamCategory ${id} not found`);
    }
    return category;
  }

  async update(
    id: number,
    payload: UpdateExamCategoryDto,
  ): Promise<ExamCategory> {
    const category = await this.findOne(id);
    if (payload.name !== undefined) {
      await this.ensureUniqueName(payload.name, id);
    }
    const merged = this.examCategoriesRepository.merge(category, payload);
    return this.examCategoriesRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.examCategoriesRepository.softDelete(category.id);
  }

  private async ensureUniqueName(name: string, ignoreId?: number): Promise<void> {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;

    const qb = this.examCategoriesRepository
      .createQueryBuilder('examCategory')
      .where('LOWER(TRIM(examCategory.name)) = LOWER(TRIM(:name))', {
        name: trimmed,
      })
      .andWhere('examCategory.deleted_at IS NULL');

    if (ignoreId) {
      qb.andWhere('examCategory.id != :ignoreId', { ignoreId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException('Já existe uma categoria com esse nome.');
    }
  }
}
