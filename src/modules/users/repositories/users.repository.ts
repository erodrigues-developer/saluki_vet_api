import { Injectable } from '@nestjs/common';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface UsersFilterOptions {
  name?: string;
  email?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

@Injectable()
export class UsersRepository extends Repository<User> {
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findPaginated(filters: UsersFilterOptions) {
    const { page, limit } = filters;
    const where: any = {};

    if (filters.name) {
      where.name = ILike(`%${filters.name}%`);
    }
    if (filters.email) {
      where.email = ILike(`%${filters.email}%`);
    }

    const sortableColumns: Record<string, keyof User> = {
      name: 'name',
      email: 'email',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
    };

    const sortBy =
      filters.sortBy && sortableColumns[filters.sortBy]
        ? sortableColumns[filters.sortBy]
        : 'createdAt';
    const sortDirection = filters.sortDirection === 'ASC' ? 'ASC' : 'DESC';

    const [data, total] = await this.findAndCount({
      where,
      relations: ['roles'],
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
