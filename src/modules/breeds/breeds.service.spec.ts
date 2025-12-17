import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BreedsService } from './breeds.service';
import { BreedsRepository } from './repositories/breeds.repository';
import { Breed } from './entities/breed.entity';
import { SpeciesService } from '../species/species.service';

const breedFactory = (id = 1): Breed => ({
  id,
  name: 'Bulldog',
  speciesId: 1,
  species: { id: 1, name: 'Cachorro' } as any,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('BreedsService', () => {
  let service: BreedsService;
  let repository: jest.Mocked<BreedsRepository>;
  let speciesService: jest.Mocked<SpeciesService>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findPaginated: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn(),
    } as any;

    speciesService = {
      findOne: jest.fn(),
    } as any;

    service = new BreedsService(repository, speciesService);
  });

  it('should create a breed after validating species', async () => {
    const dto = { name: 'Bulldog', speciesId: 1 };
    const entity = breedFactory();
    const species = { id: 1, name: 'Cachorro' } as any;
    speciesService.findOne.mockResolvedValue(species);
    repository.create.mockReturnValue({ ...entity, species } as any);
    repository.save.mockResolvedValue(entity as any);
    repository.findOne.mockResolvedValue(entity as any);

    const result = await service.create(dto as any);

    expect(speciesService.findOne).toHaveBeenCalledWith(1);
    expect(repository.create).toHaveBeenCalledWith({ ...dto, species });
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: entity.id } }),
    );
    expect(result.species?.name).toBe('Cachorro');
  });

  it('should list paginated breeds with filters', async () => {
    repository.findPaginated.mockResolvedValue({
      data: [breedFactory()],
      total: 1,
      page: 1,
      limit: 10,
    });

    const result = await service.findAll({
      name: 'Bull',
      speciesId: 1,
      sortDirection: 'asc',
      page: 1,
      limit: 10,
    });

    expect(repository.findPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Bull',
        speciesId: 1,
        sortDirection: 'ASC',
        page: 1,
        limit: 10,
      }),
    );
    expect(result.meta.total).toBe(1);
    expect(result.data[0].species?.name).toBe('Cachorro');
  });

  it('should fail on invalid pagination', async () => {
    await expect(
      service.findAll({ page: 0, limit: 10 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when breed not found', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should update a breed and validate species when provided', async () => {
    const entity = breedFactory();
    const updated = { ...entity, name: 'Pug', speciesId: 2 };
    repository.findOne
      .mockResolvedValueOnce(entity)
      .mockResolvedValueOnce({ ...updated, species: { id: 2, name: 'Gato' } } as any);
    repository.merge.mockReturnValue({ ...entity, name: 'Pug' } as any);
    repository.save.mockResolvedValue({ ...entity, name: 'Pug' } as any);
    speciesService.findOne.mockResolvedValue({ id: 2, name: 'Gato' } as any);

    const result = await service.update(1, { name: 'Pug', speciesId: 2 });

    expect(speciesService.findOne).toHaveBeenCalledWith(2);
    expect(repository.merge).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
    expect(result.name).toBe('Pug');
    expect(result.species?.name).toBe('Gato');
  });

  it('should delete a breed', async () => {
    const entity = breedFactory();
    repository.findOne.mockResolvedValue(entity);
    repository.delete.mockResolvedValue({} as any);

    await service.remove(1);

    expect(repository.delete).toHaveBeenCalledWith(1);
  });
});
