import { Injectable } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
import { Breed } from '../entities/breed.entity';

export interface BreedsFilterOptions {
  name?: string;
  speciesId?: number;
  page: number;
  limit: number;
  sortBy?: 'name' | 'species_id' | 'created_at' | 'updated_at';
  sortDirection?: 'ASC' | 'DESC';
}

export interface PaginatedBreeds {
  data: Breed[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class BreedsRepository extends Repository<Breed> {
  constructor(private readonly dataSource: DataSource) {
    super(Breed, dataSource.createEntityManager());
  }

  async findPaginated(filters: BreedsFilterOptions): Promise<PaginatedBreeds> {
    const { page, limit } = filters;

    const where: Partial<Record<keyof Breed, any>> = {};
    if (filters.name) {
      where.name = ILike(`%${filters.name}%`);
    }
    if (filters.speciesId) {
      where.speciesId = filters.speciesId;
    }

    const sortableColumns: Record<string, keyof Breed> = {
      name: 'name',
      species_id: 'speciesId',
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
      relations: ['species'],
      order: {
        [sortBy]: sortDirection,
        id: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
