import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersRepository } from './repositories/suppliers.repository';
import { Supplier } from './entities/supplier.entity';

const supplierFactory = (id = 1): Supplier => ({
  id,
  name: 'Zoetis',
  legalName: 'Zoetis Industria de Produtos Veterinarios Ltda',
  document: '12345678000199',
  email: 'contato@zoetis.com',
  phone: '+55 11 99999-9999',
  isActive: true,
  notes: 'Fornecedor homologado',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('SuppliersService', () => {
  let service: SuppliersService;
  let repository: jest.Mocked<SuppliersRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findPaginated: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
    } as any;

    service = new SuppliersService(repository);
  });

  it('should create supplier with normalized document', async () => {
    const dto = {
      name: 'Zoetis',
      document: '12.345.678/0001-99',
      email: 'contato@zoetis.com',
    };

    const entity = supplierFactory();

    repository.findOneBy.mockResolvedValue(null);
    repository.create.mockReturnValue(entity as any);
    repository.save.mockResolvedValue(entity as any);

    const result = await service.create(dto as any);

    expect(repository.findOneBy).toHaveBeenCalledWith({
      document: '12345678000199',
    });
    expect(repository.create).toHaveBeenCalledWith({
      ...dto,
      document: '12345678000199',
    });
    expect(result.id).toBe(1);
  });

  it('should reject duplicated document', async () => {
    repository.findOneBy.mockResolvedValue(supplierFactory(2));

    await expect(
      service.create({ name: 'Dup', document: '12345678000199' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should list suppliers with pagination and filters', async () => {
    repository.findPaginated.mockResolvedValue({
      data: [supplierFactory()],
      total: 1,
      page: 1,
      limit: 20,
    });

    const result = await service.findAll({
      search: 'zoe',
      isActive: true,
      sortDirection: 'asc',
      page: 1,
      limit: 20,
    });

    expect(repository.findPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'zoe',
        isActive: true,
        sortDirection: 'ASC',
      }),
    );
    expect(result.meta.total).toBe(1);
  });

  it('should fail on invalid pagination', async () => {
    await expect(service.findAll({ page: 0, limit: 20 } as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should throw when supplier not found', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should update supplier and validate document uniqueness', async () => {
    const entity = supplierFactory();
    const updated = { ...entity, document: '11122233344455' };

    repository.findOne.mockResolvedValue(entity as any);
    repository.findOneBy.mockResolvedValue(null);
    repository.merge.mockReturnValue(updated as any);
    repository.save.mockResolvedValue(updated as any);

    const result = await service.update(1, {
      document: '11.122.233/3444-55',
    } as any);

    expect(repository.findOneBy).toHaveBeenCalledWith({
      document: '11122233344455',
    });
    expect(repository.save).toHaveBeenCalled();
    expect(result.document).toBe('11122233344455');
  });

  it('should deactivate a supplier', async () => {
    const entity = supplierFactory();

    repository.findOne.mockResolvedValue(entity as any);
    repository.save.mockResolvedValue({ ...entity, isActive: false } as any);

    await service.remove(1);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, isActive: false }),
    );
  });
});
