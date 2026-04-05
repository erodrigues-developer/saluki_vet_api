import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TreatmentMapService } from './treatment-map.service';

describe('TreatmentMapService', () => {
  let service: TreatmentMapService;
  let repository: any;
  let productsRepository: any;
  let proceduresRepository: any;
  let inpatientRecordsService: any;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    productsRepository = { findOneBy: jest.fn() };
    proceduresRepository = { findOneBy: jest.fn() };
    inpatientRecordsService = { ensureActiveRecord: jest.fn() };

    service = new TreatmentMapService(
      repository,
      productsRepository,
      proceduresRepository,
      inpatientRecordsService,
    );
  });

  it('should require medicament or procedure', async () => {
    inpatientRecordsService.ensureActiveRecord.mockResolvedValue({ id: 1 });

    await expect(
      service.create(1, { scheduledAt: '2026-04-05T22:00:00.000Z' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should create a pending treatment item', async () => {
    inpatientRecordsService.ensureActiveRecord.mockResolvedValue({ id: 1 });
    productsRepository.findOneBy.mockResolvedValue({ id: 5, isActive: true });
    repository.create.mockReturnValue({ inpatientRecordId: 1, status: 'PENDING' });
    repository.save.mockResolvedValue({ id: 2 });
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 2 } as any);

    const result = await service.create(1, {
      scheduledAt: '2026-04-05T22:00:00.000Z',
      medicamentId: 5,
      dose: '1 comp',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        inpatientRecordId: 1,
        status: 'PENDING',
      }),
    );
    expect(result.id).toBe(2);
  });

  it('should prevent duplicate execution', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 8,
      inpatientRecordId: 1,
      status: 'EXECUTED',
    } as any);
    inpatientRecordsService.ensureActiveRecord.mockResolvedValue({ id: 1 });

    await expect(service.execute(8, {}, 4)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should throw when treatment item is missing', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
