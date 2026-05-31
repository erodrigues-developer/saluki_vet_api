import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ExamCategory } from '../entities/exam-category.entity';

export interface ExamCategoriesFilterOptions {
  name?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sortBy?: 'name' | 'is_active' | 'created_at' | 'updated_at';
  sortDirection?: 'ASC' | 'DESC';
}

@Injectable()
export class ExamCategoriesRepository extends Repository<ExamCategory> {
  constructor(private readonly dataSource: DataSource) {
    super(ExamCategory, dataSource.createEntityManager());
  }

  private applyFilters(
    qb: SelectQueryBuilder<ExamCategory>,
    filters: ExamCategoriesFilterOptions,
  ): void {
    const { name, isActive } = filters;
    if (name) {
      qb.andWhere('examCategory.name ILIKE :name', { name: `%${name}%` });
    }
    if (typeof isActive === 'boolean') {
      qb.andWhere('examCategory.is_active = :isActive', { isActive });
    }
  }

  async findPaginated(
    filters: ExamCategoriesFilterOptions,
  ): Promise<{ data: ExamCategory[]; total: number }> {
    const { page, limit } = filters;
    const qb = this.createQueryBuilder('examCategory');
    this.applyFilters(qb, filters);

    const sortableColumns: Record<string, string> = {
      name: 'name',
      is_active: 'is_active',
      created_at: 'created_at',
      updated_at: 'updated_at',
    };

    const sortBy =
      filters.sortBy && sortableColumns[filters.sortBy]
        ? sortableColumns[filters.sortBy]
        : 'created_at';
    const sortDirection = filters.sortDirection === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(`examCategory.${sortBy}`, sortDirection).addOrderBy(
      'examCategory.id',
      'DESC',
    );
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
