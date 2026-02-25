import { Injectable } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
import { PaymentMethod } from '../entities/payment-method.entity';

export interface PaymentMethodsFilterOptions {
  q?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

@Injectable()
export class PaymentMethodsRepository extends Repository<PaymentMethod> {
  constructor(private readonly dataSource: DataSource) {
    super(PaymentMethod, dataSource.createEntityManager());
  }

  async findPaginated(filters: PaymentMethodsFilterOptions) {
    const { page, limit } = filters;
    const where: any = {};

    if (filters.q) {
      where.name = ILike(`%${filters.q}%`);
    }

    const sortableColumns: Record<string, keyof PaymentMethod> = {
      name: 'name',
      code: 'code',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
    };

    const sortBy =
      filters.sortBy && sortableColumns[filters.sortBy]
        ? sortableColumns[filters.sortBy]
        : 'name';
    const sortDirection = filters.sortDirection === 'DESC' ? 'DESC' : 'ASC';

    const [data, total] = await this.findAndCount({
      where,
      order: {
        [sortBy]: sortDirection,
        id: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }
}
