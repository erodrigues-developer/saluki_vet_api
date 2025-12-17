import { Test, TestingModule } from '@nestjs/testing';
import { SpeciesController } from './species.controller';
import { SpeciesService } from './species.service';

describe('SpeciesController', () => {
  let controller: SpeciesController;
  let service: jest.Mocked<SpeciesService>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpeciesController],
      providers: [
        {
          provide: SpeciesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<SpeciesController>(SpeciesController);
  });

  it('should create a species', async () => {
    service.create.mockResolvedValue({ id: 1, name: 'Cachorro' } as any);
    const result = await controller.create({ name: 'Cachorro' } as any);
    expect(result).toEqual({ id: 1, name: 'Cachorro' });
  });

  it('should list species', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } } as any);
    const result = await controller.findAll({});
    expect(result.meta.total).toBe(0);
  });

  it('should get one species', async () => {
    service.findOne.mockResolvedValue({ id: 1, name: 'Cachorro' } as any);
    const result = await controller.findOne(1);
    expect(result.id).toBe(1);
  });

  it('should update a species', async () => {
    service.update.mockResolvedValue({ id: 1, name: 'Gato' } as any);
    const result = await controller.update(1, { name: 'Gato' } as any);
    expect(result.name).toBe('Gato');
  });

  it('should remove a species', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
