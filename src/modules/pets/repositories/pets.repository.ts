import { Injectable } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
import { Pet } from '../entities/pet.entity';

export interface PetsFilterOptions {
  name?: string;
  clientId?: number;
  microchipCode?: string;
  page: number;
  limit: number;
  sortBy?: 'name' | 'client_id' | 'microchip_code' | 'created_at' | 'updated_at';
  sortDirection?: 'ASC' | 'DESC';
}

export interface PaginatedPets {
  data: Pet[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class PetsRepository extends Repository<Pet> {
  constructor(private readonly dataSource: DataSource) {
    super(Pet, dataSource.createEntityManager());
  }

  async findPaginated(filters: PetsFilterOptions): Promise<PaginatedPets> {
    const { page, limit } = filters;

    const where: Partial<Record<keyof Pet, any>> = {};
    if (filters.name) {
      where.name = ILike(`%${filters.name}%`);
    }
    if (filters.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters.microchipCode) {
      where.microchipCode = ILike(`%${filters.microchipCode}%`);
    }

    const sortableColumns: Record<string, keyof Pet> = {
      name: 'name',
      client_id: 'clientId',
      microchip_code: 'microchipCode',
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
      relations: ['client', 'species', 'breed'],
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
