import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Sale } from '../entities/sale.entity';

export interface SalesFilterOptions {
  status?: string;
  clientId?: number;
  veterinarianId?: number;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

@Injectable()
export class SalesRepository extends Repository<Sale> {
  constructor(private readonly dataSource: DataSource) {
    super(Sale, dataSource.createEntityManager());
  }

  async findPaginated(filters: SalesFilterOptions) {
    const { page, limit } = filters;
    const qb = this.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.client', 'client')
      .leftJoinAndSelect('sale.veterinarian', 'veterinarian');

    if (filters.status) {
      qb.andWhere('sale.status = :status', { status: filters.status });
    }
    if (filters.clientId) {
      qb.andWhere('sale.clientId = :clientId', { clientId: filters.clientId });
    }
    if (filters.veterinarianId) {
      qb.andWhere('sale.veterinarianId = :veterinarianId', {
        veterinarianId: filters.veterinarianId,
      });
    }
    if (filters.startDate) {
      qb.andWhere('sale.saleDate >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('sale.saleDate <= :endDate', { endDate: filters.endDate });
    }

    const validSortColumns = ['saleDate', 'totalAmount', 'status', 'createdAt'];
    const sortBy =
      filters.sortBy && validSortColumns.includes(filters.sortBy)
        ? `sale.${filters.sortBy}`
        : 'sale.saleDate';
    const sortDirection = filters.sortDirection === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(sortBy, sortDirection).addOrderBy('sale.id', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }
}
