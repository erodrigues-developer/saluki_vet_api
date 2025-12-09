import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Client } from '../entities/client.entity';

export interface ClientsFilterOptions {
  name?: string;
  document?: string;
  email?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sortBy?: 'name' | 'document' | 'email' | 'city' | 'created_at' | 'updated_at';
  sortDirection?: 'ASC' | 'DESC';
}

export interface PaginatedClients {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ClientsRepository extends Repository<Client> {
  constructor(private readonly dataSource: DataSource) {
    super(Client, dataSource.createEntityManager());
  }

  private applyFilters(
    qb: SelectQueryBuilder<Client>,
    filters: ClientsFilterOptions,
  ): void {
    const { name, document, email, isActive } = filters;
    if (name) {
      qb.andWhere('client.name ILIKE :name', { name: `%${name}%` });
    }
    if (document) {
      qb.andWhere('client.document ILIKE :document', {
        document: `%${document}%`,
      });
    }
    if (email) {
      qb.andWhere('client.email ILIKE :email', { email: `%${email}%` });
    }
    if (isActive !== undefined) {
      qb.andWhere('client.is_active = :isActive', { isActive });
    }
  }

  async findPaginated(filters: ClientsFilterOptions): Promise<PaginatedClients> {
    const { page, limit } = filters;
    const qb = this.createQueryBuilder('client');
    this.applyFilters(qb, filters);

    const sortableColumns: Record<string, string> = {
      name: 'name',
      document: 'document',
      email: 'email',
      city: 'city',
      created_at: 'created_at',
      updated_at: 'updated_at',
    };

    const sortBy =
      filters.sortBy && sortableColumns[filters.sortBy]
        ? sortableColumns[filters.sortBy]
        : 'created_at';
    const sortDirection = filters.sortDirection === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(`client.${sortBy}`, sortDirection).addOrderBy('client.id', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }
}
