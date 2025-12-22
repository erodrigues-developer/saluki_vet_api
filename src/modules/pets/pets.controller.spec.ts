import { Test, TestingModule } from '@nestjs/testing';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';

describe('PetsController', () => {
  let controller: PetsController;
  let service: jest.Mocked<PetsService>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PetsController],
      providers: [
        {
          provide: PetsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<PetsController>(PetsController);
  });

  it('should create a pet', async () => {
    service.create.mockResolvedValue({
      id: 1,
      name: 'Thor',
      client: { id: 1, name: 'Maria Souza' },
      species: { id: 1, name: 'Cachorro' },
      breed: { id: 1, name: 'Vira-lata' },
    } as any);
    const result = await controller.create({
      name: 'Thor',
      clientId: 1,
      speciesId: 1,
    } as any);
    expect(result.client.name).toBe('Maria Souza');
  });

  it('should list pets', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } } as any);
    const result = await controller.findAll({});
    expect(result.meta.total).toBe(0);
  });

  it('should get one pet', async () => {
    service.findOne.mockResolvedValue({
      id: 1,
      name: 'Thor',
      client: { id: 1, name: 'Maria Souza' },
      species: { id: 1, name: 'Cachorro' },
      breed: { id: 1, name: 'Vira-lata' },
    } as any);
    const result = await controller.findOne(1);
    expect(result.client.name).toBe('Maria Souza');
  });

  it('should update a pet', async () => {
    service.update.mockResolvedValue({
      id: 1,
      name: 'Luna',
      client: { id: 2, name: 'João Pereira' },
      species: { id: 2, name: 'Gato' },
      breed: { id: 2, name: 'Siamês' },
    } as any);
    const result = await controller.update(1, { name: 'Luna' } as any);
    expect(result.client.name).toBe('João Pereira');
  });

  it('should remove a pet', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
