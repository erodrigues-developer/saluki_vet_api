import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ExamType } from '../entities/exam-type.entity';

interface FindPaginatedParams {
  page: number;
  limit: number;
  name?: string;
  isActive?: boolean;
  examCategoryId?: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

@Injectable()
export class ExamTypesRepository extends Repository<ExamType> {
  constructor(private readonly dataSource: DataSource) {
    super(ExamType, dataSource.createEntityManager());
  }

  async findPaginated(params: FindPaginatedParams): Promise<[ExamType[], number]> {
    const { page, limit, name, isActive, examCategoryId, sortBy, sortDirection } = params;

    const qb = this.createQueryBuilder('examType')
      .leftJoinAndSelect('examType.examCategory', 'examCategory');

    if (name?.trim()) {
      qb.andWhere('examType.name ILIKE :name', { name: `%${name.trim()}%` });
    }

    if (typeof isActive === 'boolean') {
      qb.andWhere('examType.is_active = :isActive', { isActive });
    }

    if (examCategoryId) {
      qb.andWhere('examType.exam_category_id = :examCategoryId', {
        examCategoryId,
      });
    }

    const sortableMap: Record<string, string> = {
      name: 'examType.name',
      defaultPrice: 'examType.defaultPrice',
      isActive: 'examType.isActive',
      createdAt: 'examType.createdAt',
      updatedAt: 'examType.updatedAt',
    };

    const orderBy = sortableMap[sortBy] || 'examType.updatedAt';

    qb.orderBy(orderBy, sortDirection).addOrderBy('examType.id', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }
}
