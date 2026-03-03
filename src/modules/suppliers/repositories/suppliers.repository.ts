import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';

export interface SuppliersFilterOptions {
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortDirection?: 'ASC' | 'DESC';
}

export interface PaginatedSuppliers {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SuppliersRepository extends Repository<Supplier> {
  constructor(private readonly dataSource: DataSource) {
    super(Supplier, dataSource.createEntityManager());
  }

  async findPaginated(
    filters: SuppliersFilterOptions,
  ): Promise<PaginatedSuppliers> {
    const query = this.createQueryBuilder('supplier');

    if (filters.search) {
      query.andWhere(
        `(
          supplier.name ILIKE :search
          OR supplier.legalName ILIKE :search
          OR supplier.document ILIKE :search
        )`,
        {
          search: `%${filters.search}%`,
        },
      );
    }

    if (typeof filters.isActive === 'boolean') {
      query.andWhere('supplier.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    const sortableColumns: Record<string, string> = {
      name: 'supplier.name',
      created_at: 'supplier.createdAt',
      updated_at: 'supplier.updatedAt',
    };

    const sortColumn =
      filters.sortBy && sortableColumns[filters.sortBy]
        ? sortableColumns[filters.sortBy]
        : 'supplier.name';
    const sortDirection = filters.sortDirection === 'DESC' ? 'DESC' : 'ASC';

    query.orderBy(sortColumn, sortDirection).addOrderBy('supplier.id', 'DESC');

    const page = filters.page;
    const limit = filters.limit;

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    return { data, total, page, limit };
  }
}
