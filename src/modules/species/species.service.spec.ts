import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SpeciesService } from './species.service';
import { SpeciesRepository } from './repositories/species.repository';
import { Species } from './entities/species.entity';

const speciesFactory = (id = 1): Species => ({
  id,
  name: 'Cachorro',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('SpeciesService', () => {
  let service: SpeciesService;
  let repository: jest.Mocked<SpeciesRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findPaginated: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new SpeciesService(repository);
  });

  it('should create a species', async () => {
    const dto = { name: 'Cachorro' };
    const entity = speciesFactory();
    repository.create.mockReturnValue(entity as any);
    repository.save.mockResolvedValue(entity as any);

    const result = await service.create(dto as any);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(result).toEqual(entity);
  });

  it('should list paginated species with filters', async () => {
    repository.findPaginated.mockResolvedValue({
      data: [speciesFactory()],
      total: 1,
      page: 1,
      limit: 10,
    });

    const result = await service.findAll({
      name: 'Ca',
      sortDirection: 'asc',
      page: 1,
      limit: 10,
    });

    expect(repository.findPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ca',
        sortDirection: 'ASC',
        page: 1,
        limit: 10,
      }),
    );
    expect(result.meta.total).toBe(1);
  });

  it('should fail on invalid pagination', async () => {
    await expect(service.findAll({ page: 0, limit: 10 } as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should throw when species not found', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should update a species', async () => {
    const entity = speciesFactory();
    repository.findOne.mockResolvedValue(entity);
    repository.merge.mockReturnValue({ ...entity, name: 'Gato' } as any);
    repository.save.mockResolvedValue({ ...entity, name: 'Gato' } as any);

    const result = await service.update(1, { name: 'Gato' });

    expect(repository.merge).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
    expect(result.name).toBe('Gato');
  });

  it('should delete a species', async () => {
    const entity = speciesFactory();
    repository.findOne.mockResolvedValue(entity);
    repository.delete.mockResolvedValue({} as any);

    await service.remove(1);

    expect(repository.delete).toHaveBeenCalledWith(1);
  });
});
