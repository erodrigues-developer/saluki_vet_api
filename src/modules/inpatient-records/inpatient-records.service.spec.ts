import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InpatientRecordsService } from './inpatient-records.service';

describe('InpatientRecordsService', () => {
  let service: InpatientRecordsService;
  let inpatientRecordsRepository: any;
  let boxesRepository: any;
  let petsRepository: any;
  let consultationsRepository: any;
  let clinicalParametersRepository: any;
  let treatmentMapRepository: any;

  beforeEach(() => {
    inpatientRecordsRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    boxesRepository = { findOneBy: jest.fn() };
    petsRepository = { findOne: jest.fn() };
    consultationsRepository = { findOneBy: jest.fn() };
    clinicalParametersRepository = { find: jest.fn() };
    treatmentMapRepository = { count: jest.fn() };

    service = new InpatientRecordsService(
      inpatientRecordsRepository,
      boxesRepository,
      petsRepository,
      consultationsRepository,
      clinicalParametersRepository,
      treatmentMapRepository,
    );
  });

  it('should create active inpatient record when box and pet are available', async () => {
    const saved = { id: 10 };

    petsRepository.findOne.mockResolvedValue({ id: 1 });
    boxesRepository.findOneBy.mockResolvedValue({ id: 2, isActive: true });
    inpatientRecordsRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    inpatientRecordsRepository.create.mockReturnValue({
      petId: 1,
      boxId: 2,
      status: 'ACTIVE',
    });
    inpatientRecordsRepository.save.mockResolvedValue(saved);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 10 } as any);

    const result = await service.create({ petId: 1, boxId: 2 });

    expect(inpatientRecordsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        petId: 1,
        boxId: 2,
        status: 'ACTIVE',
      }),
    );
    expect(result.id).toBe(10);
  });

  it('should reject admission when pet already has active record', async () => {
    petsRepository.findOne.mockResolvedValue({ id: 1 });
    boxesRepository.findOneBy.mockResolvedValue({ id: 2, isActive: true });
    inpatientRecordsRepository.findOne.mockResolvedValueOnce({ id: 9 });

    await expect(service.create({ petId: 1, boxId: 2 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should reject admission when consultation belongs to another pet', async () => {
    petsRepository.findOne.mockResolvedValue({ id: 1 });
    boxesRepository.findOneBy.mockResolvedValue({ id: 2, isActive: true });
    inpatientRecordsRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    consultationsRepository.findOneBy.mockResolvedValue({
      id: 4,
      petId: 99,
    });

    await expect(
      service.create({ petId: 1, boxId: 2, consultationId: 4 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when active record is not found', async () => {
    inpatientRecordsRepository.findOne.mockResolvedValue(null);

    await expect(service.ensureActiveRecord(55)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
