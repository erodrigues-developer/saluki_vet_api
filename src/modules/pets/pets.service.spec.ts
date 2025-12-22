import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsRepository } from './repositories/pets.repository';
import { Pet } from './entities/pet.entity';
import { ClientsService } from '../clients/clients.service';
import { SpeciesService } from '../species/species.service';
import { BreedsService } from '../breeds/breeds.service';

const petFactory = (id = 1): Pet => ({
  id,
  name: 'Thor',
  clientId: 1,
  client: { id: 1, name: 'Maria Souza' } as any,
  speciesId: 1,
  species: { id: 1, name: 'Cachorro' } as any,
  breedId: 1,
  breed: { id: 1, name: 'Vira-lata' } as any,
  sex: 'M',
  dateOfBirth: new Date('2020-05-01'),
  weightKg: 12.5,
  color: 'Caramelo',
  microchipCode: 'MC-THOR-001',
  allergies: 'Poeira',
  chronicDiseases: null,
  notes: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

describe('PetsService', () => {
  let service: PetsService;
  let repository: jest.Mocked<PetsRepository>;
  let clientsService: jest.Mocked<ClientsService>;
  let speciesService: jest.Mocked<SpeciesService>;
  let breedsService: jest.Mocked<BreedsService>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findPaginated: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    clientsService = {
      findOne: jest.fn(),
    } as any;

    speciesService = {
      findOne: jest.fn(),
    } as any;

    breedsService = {
      findOne: jest.fn(),
    } as any;

    service = new PetsService(
      repository,
      clientsService,
      speciesService,
      breedsService,
    );
  });

  it('should create a pet after validating references', async () => {
    const dto = { name: 'Thor', clientId: 1, speciesId: 1, breedId: 1 };
    const entity = petFactory();
    clientsService.findOne.mockResolvedValue({ id: 1 } as any);
    speciesService.findOne.mockResolvedValue({ id: 1 } as any);
    breedsService.findOne.mockResolvedValue({ id: 1 } as any);
    repository.create.mockReturnValue(entity as any);
    repository.save.mockResolvedValue(entity as any);
    repository.findOne.mockResolvedValue(entity as any);

    const result = await service.create(dto as any);

    expect(clientsService.findOne).toHaveBeenCalledWith(1);
    expect(speciesService.findOne).toHaveBeenCalledWith(1);
    expect(breedsService.findOne).toHaveBeenCalledWith(1);
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(result.client?.name).toBe('Maria Souza');
    expect(result.species?.name).toBe('Cachorro');
    expect(result.breed?.name).toBe('Vira-lata');
  });

  it('should list paginated pets with filters', async () => {
    repository.findPaginated.mockResolvedValue({
      data: [petFactory()],
      total: 1,
      page: 1,
      limit: 10,
    });

    const result = await service.findAll({
      name: 'Tho',
      clientId: 1,
      microchipCode: 'MC',
      sortBy: 'microchipCode',
      sortDirection: 'asc',
      page: 1,
      limit: 10,
    });

    expect(repository.findPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Tho',
        clientId: 1,
        microchipCode: 'MC',
        sortBy: 'microchip_code',
        sortDirection: 'ASC',
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

  it('should throw when pet not found', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should update a pet after validating references', async () => {
    const entity = petFactory();
    repository.findOne
      .mockResolvedValueOnce(entity)
      .mockResolvedValueOnce({
        ...entity,
        name: 'Luna',
        client: { id: 2, name: 'João Pereira' },
        species: { id: 2, name: 'Gato' },
        breed: { id: 2, name: 'Siamês' },
      } as any);
    repository.merge.mockReturnValue({ ...entity, name: 'Luna' } as any);
    repository.save.mockResolvedValue({ ...entity, name: 'Luna' } as any);
    clientsService.findOne.mockResolvedValue({ id: 2 } as any);
    speciesService.findOne.mockResolvedValue({ id: 2 } as any);
    breedsService.findOne.mockResolvedValue({ id: 2 } as any);

    const result = await service.update(1, {
      name: 'Luna',
      clientId: 2,
      speciesId: 2,
      breedId: 2,
    });

    expect(clientsService.findOne).toHaveBeenCalledWith(2);
    expect(speciesService.findOne).toHaveBeenCalledWith(2);
    expect(breedsService.findOne).toHaveBeenCalledWith(2);
    expect(repository.merge).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
    expect(result.name).toBe('Luna');
    expect(result.client?.name).toBe('João Pereira');
    expect(result.species?.name).toBe('Gato');
    expect(result.breed?.name).toBe('Siamês');
  });

  it('should soft delete a pet', async () => {
    const entity = petFactory();
    repository.findOne.mockResolvedValue(entity);
    repository.softDelete.mockResolvedValue({} as any);

    await service.remove(1);

    expect(repository.softDelete).toHaveBeenCalledWith(1);
  });
});
