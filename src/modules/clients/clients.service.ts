import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Client } from './entities/client.entity';
import { ClientsRepository } from './repositories/clients.repository';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterClientsDto } from './dto/filter-clients.dto';
import { DataSource } from 'typeorm';
import { Pet } from '../pets/entities/pet.entity';

@Injectable()
export class ClientsService {
  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: CreateClientDto): Promise<Client> {
    const client = this.clientsRepository.create(payload);
    return this.clientsRepository.save(client);
  }

  async findAll(filters: FilterClientsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    const { data, total } = await this.clientsRepository.findPaginated({
      name: filters.name,
      document: filters.document,
      email: filters.email,
      isActive:
        filters.isActive !== undefined
          ? filters.isActive === 'true'
          : undefined,
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

  async findOne(id: number): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });
    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return client;
  }

  async findPets(id: number) {
    await this.findOne(id);

    const petsRepository = this.dataSource.getRepository(Pet);
    return {
      data: await petsRepository.find({
        where: { clientId: id },
        relations: ['species', 'breed'],
        order: {
          updatedAt: 'DESC',
          id: 'DESC',
        },
      }),
    };
  }

  async update(id: number, payload: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    const merged = this.clientsRepository.merge(client, payload);
    return this.clientsRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.clientsRepository.softDelete(id);
  }
}
