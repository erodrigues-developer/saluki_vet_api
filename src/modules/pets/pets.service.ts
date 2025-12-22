import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PetsRepository } from './repositories/pets.repository';
import { Pet } from './entities/pet.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { FilterPetsDto } from './dto/filter-pets.dto';
import { ClientsService } from '../clients/clients.service';
import { SpeciesService } from '../species/species.service';
import { BreedsService } from '../breeds/breeds.service';

@Injectable()
export class PetsService {
  constructor(
    private readonly petsRepository: PetsRepository,
    private readonly clientsService: ClientsService,
    private readonly speciesService: SpeciesService,
    private readonly breedsService: BreedsService,
  ) {}

  async create(payload: CreatePetDto): Promise<Pet> {
    await this.clientsService.findOne(payload.clientId);
    await this.speciesService.findOne(payload.speciesId);
    if (payload.breedId) {
      await this.breedsService.findOne(payload.breedId);
    }
    const pet = this.petsRepository.create(payload);
    const saved = await this.petsRepository.save(pet);
    return this.findOne(saved.id);
  }

  async findAll(filters: FilterPetsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    const { data, total } = await this.petsRepository.findPaginated({
      name: filters.name,
      clientId: filters.clientId,
      microchipCode: filters.microchipCode,
      page,
      limit,
      sortBy:
        filters.sortBy === 'createdAt'
          ? 'created_at'
          : filters.sortBy === 'updatedAt'
          ? 'updated_at'
          : filters.sortBy === 'clientId'
          ? 'client_id'
          : filters.sortBy === 'microchipCode'
          ? 'microchip_code'
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

  async findOne(id: number): Promise<Pet> {
    const pet = await this.petsRepository.findOne({
      where: { id },
      relations: ['client', 'species', 'breed'],
    });
    if (!pet) {
      throw new NotFoundException(`Pet ${id} not found`);
    }
    return pet;
  }

  async update(id: number, payload: UpdatePetDto): Promise<Pet> {
    if (payload.clientId) {
      await this.clientsService.findOne(payload.clientId);
    }
    if (payload.speciesId) {
      await this.speciesService.findOne(payload.speciesId);
    }
    if (payload.breedId) {
      await this.breedsService.findOne(payload.breedId);
    }
    const pet = await this.petsRepository.findOne({ where: { id } });
    if (!pet) {
      throw new NotFoundException(`Pet ${id} not found`);
    }
    const merged = this.petsRepository.merge(pet, payload);
    const saved = await this.petsRepository.save(merged);
    return this.findOne(saved.id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.petsRepository.softDelete(id);
  }
}
