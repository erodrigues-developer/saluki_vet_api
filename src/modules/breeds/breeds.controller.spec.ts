import { Test, TestingModule } from '@nestjs/testing';
import { BreedsController } from './breeds.controller';
import { BreedsService } from './breeds.service';

describe('BreedsController', () => {
  let controller: BreedsController;
  let service: jest.Mocked<BreedsService>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BreedsController],
      providers: [
        {
          provide: BreedsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<BreedsController>(BreedsController);
  });

  it('should create a breed', async () => {
    service.create.mockResolvedValue({
      id: 1,
      name: 'Bulldog',
      species: { id: 1, name: 'Cachorro' },
    } as any);
    const result = await controller.create({ name: 'Bulldog', speciesId: 1 } as any);
    expect(result.species.name).toBe('Cachorro');
  });

  it('should list breeds', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } } as any);
    const result = await controller.findAll({});
    expect(result.meta.total).toBe(0);
  });

  it('should get one breed', async () => {
    service.findOne.mockResolvedValue({
      id: 1,
      name: 'Bulldog',
      species: { id: 1, name: 'Cachorro' },
    } as any);
    const result = await controller.findOne(1);
    expect(result.species.name).toBe('Cachorro');
  });

  it('should update a breed', async () => {
    service.update.mockResolvedValue({
      id: 1,
      name: 'Pug',
      species: { id: 1, name: 'Cachorro' },
    } as any);
    const result = await controller.update(1, { name: 'Pug' } as any);
    expect(result.species.name).toBe('Cachorro');
  });

  it('should remove a breed', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
