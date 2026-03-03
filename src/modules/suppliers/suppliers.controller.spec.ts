import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: jest.Mocked<SuppliersService>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
  });

  it('should create supplier', async () => {
    service.create.mockResolvedValue({ id: 1, name: 'Zoetis' } as any);

    const result = await controller.create({ name: 'Zoetis' } as any);

    expect(result.id).toBe(1);
  });

  it('should list suppliers', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } } as any);

    const result = await controller.findAll({});

    expect(result.meta.total).toBe(0);
  });

  it('should get supplier by id', async () => {
    service.findOne.mockResolvedValue({ id: 1, name: 'Zoetis' } as any);

    const result = await controller.findOne(1);

    expect(result.name).toBe('Zoetis');
  });

  it('should update supplier', async () => {
    service.update.mockResolvedValue({ id: 1, name: 'Zoetis BR' } as any);

    const result = await controller.update(1, { name: 'Zoetis BR' } as any);

    expect(result.name).toBe('Zoetis BR');
  });

  it('should remove supplier', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
