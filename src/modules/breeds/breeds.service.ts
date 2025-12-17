import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BreedsRepository } from './repositories/breeds.repository';
import { Breed } from './entities/breed.entity';
import { CreateBreedDto } from './dto/create-breed.dto';
import { UpdateBreedDto } from './dto/update-breed.dto';
import { FilterBreedsDto } from './dto/filter-breeds.dto';
import { SpeciesService } from '../species/species.service';

@Injectable()
export class BreedsService {
  constructor(
    private readonly breedsRepository: BreedsRepository,
    private readonly speciesService: SpeciesService,
  ) {}

  async create(payload: CreateBreedDto): Promise<Breed> {
    const species = await this.speciesService.findOne(payload.speciesId);
    const breed = this.breedsRepository.create({
      ...payload,
      species,
    });
    const saved = await this.breedsRepository.save(breed);
    return this.findOne(saved.id);
  }

  async findAll(filters: FilterBreedsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    const { data, total } = await this.breedsRepository.findPaginated({
      name: filters.name,
      speciesId: filters.speciesId,
      page,
      limit,
      sortBy:
        filters.sortBy === 'createdAt'
          ? 'created_at'
          : filters.sortBy === 'updatedAt'
          ? 'updated_at'
          : filters.sortBy === 'speciesId'
          ? 'species_id'
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

  async findOne(id: number): Promise<Breed> {
    const breed = await this.breedsRepository.findOne({
      where: { id },
      relations: ['species'],
    });
    if (!breed) {
      throw new NotFoundException(`Breed ${id} not found`);
    }
    return breed;
  }

  async update(id: number, payload: UpdateBreedDto): Promise<Breed> {
    let species = undefined;
    if (payload.speciesId) {
      species = await this.speciesService.findOne(payload.speciesId);
    }
    const breed = await this.findOne(id);
    const merged = this.breedsRepository.merge(
      breed,
      payload,
      species && { species },
    );
    const saved = await this.breedsRepository.save(merged);
    return this.findOne(saved.id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.breedsRepository.delete(id);
  }
}
