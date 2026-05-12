import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Species } from '../entities/species.entity';

export interface SpeciesFilterOptions {
  name?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sortBy?: 'name' | 'is_active' | 'created_at' | 'updated_at';
  sortDirection?: 'ASC' | 'DESC';
}

export interface PaginatedSpecies {
  data: Species[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SpeciesRepository extends Repository<Species> {
  constructor(private readonly dataSource: DataSource) {
    super(Species, dataSource.createEntityManager());
  }

  private applyFilters(
    qb: SelectQueryBuilder<Species>,
    filters: SpeciesFilterOptions,
  ): void {
    const { name, isActive } = filters;
    if (name) {
      qb.andWhere('species.name ILIKE :name', { name: `%${name}%` });
    }
    if (typeof isActive === 'boolean') {
      qb.andWhere('species.is_active = :isActive', { isActive });
    }
  }

  async findPaginated(
    filters: SpeciesFilterOptions,
  ): Promise<PaginatedSpecies> {
    const { page, limit } = filters;
    const qb = this.createQueryBuilder('species');
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

    qb.orderBy(`species.${sortBy}`, sortDirection).addOrderBy(
      'species.id',
      'DESC',
    );
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }
}
