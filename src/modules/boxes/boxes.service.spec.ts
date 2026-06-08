import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BoxesService } from './boxes.service';
import { Box } from './entities/box.entity';
import { InpatientRecord } from '../inpatient-records/entities/inpatient-record.entity';

const boxFactory = (id = 1): Box => ({
  id,
  name: 'Gatil A',
  description: 'Internação padrão felinos',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createQueryBuilderMock = (rows: Box[]) => {
  const builder = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(rows),
    getOne: jest.fn().mockResolvedValue(null),
  };
  return builder;
};

describe('BoxesService', () => {
  let service: BoxesService;
  let boxesRepository: jest.Mocked<Repository<Box>>;
  let inpatientRecordsRepository: jest.Mocked<Repository<InpatientRecord>>;

  beforeEach(() => {
    boxesRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn(),
    } as any;

    inpatientRecordsRepository = {
      find: jest.fn(),
      count: jest.fn(),
    } as any;

    service = new BoxesService(boxesRepository, inpatientRecordsRepository);
  });

  it('should create a box', async () => {
    const entity = boxFactory();
    const uniquenessBuilder = createQueryBuilderMock([]);
    uniquenessBuilder.getOne.mockResolvedValue(null);
    boxesRepository.createQueryBuilder.mockReturnValue(uniquenessBuilder as any);
    boxesRepository.create.mockReturnValue(entity as any);
    boxesRepository.save.mockResolvedValue(entity as any);
    boxesRepository.findOne.mockResolvedValue(entity as any);

    const result = await service.create({
      name: 'Gatil A',
      description: 'Internação padrão felinos',
      isActive: true,
    });

    expect(boxesRepository.create).toHaveBeenCalledWith({
      name: 'Gatil A',
      description: 'Internação padrão felinos',
      isActive: true,
    });
    expect(result.name).toBe('Gatil A');
  });

  it('should list boxes with pagination and occupancy', async () => {
    const listBuilder = createQueryBuilderMock([boxFactory()]);
    boxesRepository.createQueryBuilder.mockReturnValue(listBuilder as any);
    inpatientRecordsRepository.find.mockResolvedValue([
      {
        id: 10,
        boxId: 1,
        status: 'ACTIVE',
        pet: { id: 9, name: 'Mingau' },
      } as any,
    ]);

    const result = await service.findAll({
      page: 1,
      limit: 10,
      occupancyStatus: 'OCCUPIED',
      sortBy: 'updatedAt',
      sortDirection: 'desc',
    });

    expect(listBuilder.orderBy).toHaveBeenCalled();
    expect(result.meta.total).toBe(1);
    expect(result.data[0].occupancyStatus).toBe('OCCUPIED');
  });

  it('should fail on invalid pagination', async () => {
    await expect(service.findAll({ page: 0, limit: 10 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should throw when box not found', async () => {
    boxesRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should update a box', async () => {
    const entity = boxFactory();
    const uniquenessBuilder = createQueryBuilderMock([]);
    uniquenessBuilder.getOne.mockResolvedValue(null);
    boxesRepository.createQueryBuilder.mockReturnValue(uniquenessBuilder as any);
    boxesRepository.findOne
      .mockResolvedValueOnce(entity as any)
      .mockResolvedValueOnce({ ...entity, name: 'Gatil B' } as any);
    boxesRepository.merge.mockReturnValue({ ...entity, name: 'Gatil B' } as any);
    boxesRepository.save.mockResolvedValue({ ...entity, name: 'Gatil B' } as any);

    const result = await service.update(1, { name: 'Gatil B', isActive: false });

    expect(boxesRepository.merge).toHaveBeenCalled();
    expect(boxesRepository.save).toHaveBeenCalled();
    expect(result.name).toBe('Gatil B');
  });

  it('should block delete when there are linked admissions', async () => {
    boxesRepository.findOne.mockResolvedValue(boxFactory() as any);
    inpatientRecordsRepository.count.mockResolvedValue(1);

    await expect(service.remove(1)).rejects.toBeInstanceOf(BadRequestException);
  });
});
