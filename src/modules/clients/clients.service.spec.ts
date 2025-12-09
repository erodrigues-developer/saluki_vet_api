import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsRepository } from './repositories/clients.repository';
import { Client } from './entities/client.entity';

const clientFactory = (id = 1): Client => ({
  id,
  name: 'Maria Souza',
  document: '12345678900',
  phone: '4002-8922',
  mobilePhone: '99999-9999',
  email: 'maria@email.com',
  street: 'Rua A',
  number: '100',
  complement: null,
  district: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310-000',
  notes: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: jest.Mocked<ClientsRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findPaginated: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    service = new ClientsService(repository);
  });

  it('should create a client', async () => {
    const dto = { name: 'Maria Souza' };
    const entity = clientFactory();
    repository.create.mockReturnValue(entity as any);
    repository.save.mockResolvedValue(entity as any);

    const result = await service.create(dto as any);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(result).toEqual(entity);
  });

  it('should list paginated clients with filters', async () => {
    repository.findPaginated.mockResolvedValue({
      data: [clientFactory()],
      total: 1,
      page: 1,
      limit: 10,
    });

    const result = await service.findAll({
      name: 'Maria',
      isActive: 'true',
      page: 1,
      limit: 10,
    });

    expect(repository.findPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Maria',
        isActive: true,
        page: 1,
        limit: 10,
      }),
    );
    expect(result.meta.total).toBe(1);
  });

  it('should fail on invalid pagination', async () => {
    await expect(
      service.findAll({ page: 0, limit: 10 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when client not found', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should update a client', async () => {
    const entity = clientFactory();
    repository.findOne.mockResolvedValue(entity);
    repository.merge.mockReturnValue({ ...entity, name: 'Novo' } as any);
    repository.save.mockResolvedValue({ ...entity, name: 'Novo' } as any);

    const result = await service.update(1, { name: 'Novo' });

    expect(repository.merge).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
    expect(result.name).toBe('Novo');
  });

  it('should soft delete a client', async () => {
    const entity = clientFactory();
    repository.findOne.mockResolvedValue(entity);
    repository.softDelete.mockResolvedValue({} as any);

    await service.remove(1);

    expect(repository.softDelete).toHaveBeenCalledWith(1);
  });
});
