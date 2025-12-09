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

@Injectable()
export class ClientsService {
  constructor(private readonly clientsRepository: ClientsRepository) {}

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
