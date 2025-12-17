import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SpeciesRepository } from './repositories/species.repository';
import { Species } from './entities/species.entity';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';
import { FilterSpeciesDto } from './dto/filter-species.dto';

@Injectable()
export class SpeciesService {
  constructor(private readonly speciesRepository: SpeciesRepository) {}

  async create(payload: CreateSpeciesDto): Promise<Species> {
    const species = this.speciesRepository.create(payload);
    return this.speciesRepository.save(species);
  }

  async findAll(filters: FilterSpeciesDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    const { data, total } = await this.speciesRepository.findPaginated({
      name: filters.name,
      page,
      limit,
      sortBy:
        filters.sortBy === 'createdAt'
          ? 'created_at'
          : filters.sortBy === 'updatedAt'
          ? 'updated_at'
          : (filters.sortBy as any),
      sortDirection:
        filters.sortDirection?.toLowerCase() === 'asc' ? 'ASC' : 'DESC',
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: number): Promise<Species> {
    const species = await this.speciesRepository.findOne({ where: { id } });
    if (!species) {
      throw new NotFoundException(`Species ${id} not found`);
    }
    return species;
  }

  async update(id: number, payload: UpdateSpeciesDto): Promise<Species> {
    const species = await this.findOne(id);
    const merged = this.speciesRepository.merge(species, payload);
    return this.speciesRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.speciesRepository.delete(id);
  }
}
