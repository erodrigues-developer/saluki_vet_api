import { Test, TestingModule } from '@nestjs/testing';
import { BoxesController } from './boxes.controller';
import { BoxesService } from './boxes.service';

describe('BoxesController', () => {
  let controller: BoxesController;
  let service: jest.Mocked<BoxesService>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoxesController],
      providers: [
        {
          provide: BoxesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<BoxesController>(BoxesController);
  });

  it('should create a box', async () => {
    service.create.mockResolvedValue({
      id: 1,
      name: 'Canil P2',
      description: 'Internação cães pequeno porte',
      isActive: true,
    } as any);

    const result = await controller.create({
      name: 'Canil P2',
      description: 'Internação cães pequeno porte',
    } as any);

    expect(result.name).toBe('Canil P2');
  });

  it('should list boxes', async () => {
    service.findAll.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10 },
    } as any);

    const result = await controller.findAll({ page: 1, limit: 10 });
    expect(result.meta.total).toBe(0);
  });

  it('should get one box', async () => {
    service.findOne.mockResolvedValue({
      id: 1,
      name: 'Gatil A',
      isActive: true,
    } as any);

    const result = await controller.findOne(1);
    expect(result.name).toBe('Gatil A');
  });

  it('should update a box', async () => {
    service.update.mockResolvedValue({
      id: 1,
      name: 'Gatil B',
      isActive: false,
    } as any);

    const result = await controller.update(1, { name: 'Gatil B' } as any);
    expect(result.name).toBe('Gatil B');
  });

  it('should remove a box', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
