import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: jest.Mocked<ClientsService>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
  });

  it('should create a client', async () => {
    service.create.mockResolvedValue({ id: 1, name: 'Maria' } as any);
    const result = await controller.create({ name: 'Maria' } as any);
    expect(result).toEqual({ id: 1, name: 'Maria' });
  });

  it('should list clients', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } } as any);
    const result = await controller.findAll({});
    expect(result.meta.total).toBe(0);
  });

  it('should get one client', async () => {
    service.findOne.mockResolvedValue({ id: 1, name: 'Maria' } as any);
    const result = await controller.findOne(1);
    expect(result.id).toBe(1);
  });

  it('should update a client', async () => {
    service.update.mockResolvedValue({ id: 1, name: 'Novo' } as any);
    const result = await controller.update(1, { name: 'Novo' } as any);
    expect(result.name).toBe('Novo');
  });

  it('should remove a client', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
