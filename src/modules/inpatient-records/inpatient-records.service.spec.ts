import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InpatientRecordsService } from './inpatient-records.service';
import { InpatientRecord } from './entities/inpatient-record.entity';
import { Box } from '../boxes/entities/box.entity';
import { InpatientRecordTransfer } from './entities/inpatient-record-transfer.entity';

describe('InpatientRecordsService', () => {
  let service: InpatientRecordsService;
  let inpatientRecordsRepository: any;
  let boxesRepository: any;
  let petsRepository: any;
  let consultationsRepository: any;
  let clinicalParametersRepository: any;
  let treatmentMapRepository: any;
  let inpatientRecordTransfersRepository: any;
  let transactionManager: any;

  beforeEach(() => {
    inpatientRecordsRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };
    boxesRepository = { findOneBy: jest.fn() };
    petsRepository = { findOne: jest.fn() };
    consultationsRepository = { findOneBy: jest.fn() };
    clinicalParametersRepository = { find: jest.fn() };
    treatmentMapRepository = { count: jest.fn() };
    inpatientRecordTransfersRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    transactionManager = {
      getRepository: jest.fn((entity) => {
        if (entity === InpatientRecord) return inpatientRecordsRepository;
        if (entity === Box) return boxesRepository;
        if (entity === InpatientRecordTransfer) {
          return inpatientRecordTransfersRepository;
        }
        return null;
      }),
    };

    inpatientRecordsRepository.manager.transaction.mockImplementation(
      async (callback: any) => callback(transactionManager),
    );

    service = new InpatientRecordsService(
      inpatientRecordsRepository,
      boxesRepository,
      petsRepository,
      consultationsRepository,
      clinicalParametersRepository,
      treatmentMapRepository,
      inpatientRecordTransfersRepository,
    );
  });

  it('should create active inpatient record when box and pet are available', async () => {
    const saved = { id: 10 };

    petsRepository.findOne.mockResolvedValue({ id: 1, client: { id: 7 } });
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

    const result = await service.create({
      petId: 1,
      boxId: 2,
      reason: 'Observação clínica',
    } as any);

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
    petsRepository.findOne.mockResolvedValue({ id: 1, client: { id: 7 } });
    boxesRepository.findOneBy.mockResolvedValue({ id: 2, isActive: true });
    inpatientRecordsRepository.findOne.mockResolvedValueOnce({ id: 9 });

    await expect(
      service.create({ petId: 1, boxId: 2, reason: 'Observação clínica' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject admission when pet has no linked client', async () => {
    petsRepository.findOne.mockResolvedValue({ id: 1, client: null });

    await expect(service.create({ petId: 1, boxId: 2, reason: 'Observação' } as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should reject admission when consultation belongs to another pet', async () => {
    petsRepository.findOne.mockResolvedValue({ id: 1, client: { id: 7 } });
    boxesRepository.findOneBy.mockResolvedValue({ id: 2, isActive: true });
    inpatientRecordsRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    consultationsRepository.findOneBy.mockResolvedValue({
      id: 4,
      petId: 99,
    });

    await expect(
      service.create({ petId: 1, boxId: 2, consultationId: 4, reason: 'Observação clínica' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject admission when consultation was already used before', async () => {
    petsRepository.findOne.mockResolvedValue({ id: 1, client: { id: 7 } });
    boxesRepository.findOneBy.mockResolvedValue({ id: 2, isActive: true });
    inpatientRecordsRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 13, consultationId: 4 });

    await expect(
      service.create({ petId: 1, boxId: 2, consultationId: 4, reason: 'Pós-operatório' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when active record is not found', async () => {
    inpatientRecordsRepository.findOne.mockResolvedValue(null);

    await expect(service.ensureActiveRecord(55)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should transfer active inpatient record to an empty box', async () => {
    inpatientRecordsRepository.findOne.mockResolvedValueOnce({
      id: 10,
      status: 'ACTIVE',
      boxId: 2,
      box: { id: 2, name: 'Canil A' },
    });
    boxesRepository.findOneBy.mockResolvedValue({ id: 5, name: 'Canil B', isActive: true });
    inpatientRecordsRepository.findOne.mockResolvedValueOnce(null);
    inpatientRecordTransfersRepository.create.mockReturnValue({
      inpatientRecordId: 10,
      fromBoxId: 2,
      toBoxId: 5,
      reason: 'Isolamento',
    });
    inpatientRecordTransfersRepository.save.mockResolvedValue({ id: 91 });
    inpatientRecordsRepository.save.mockResolvedValue({ id: 10, boxId: 5 });
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 10, boxId: 5 } as any);

    const result = await service.transfer(10, {
      boxId: 5,
      reason: 'Isolamento',
    } as any);

    expect(inpatientRecordTransfersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        inpatientRecordId: 10,
        fromBoxId: 2,
        toBoxId: 5,
        reason: 'Isolamento',
      }),
    );
    expect(inpatientRecordsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        boxId: 5,
      }),
    );
    expect(result.boxId).toBe(5);
  });

  it('should reject transfer when target box is occupied', async () => {
    inpatientRecordsRepository.findOne.mockResolvedValueOnce({
      id: 10,
      status: 'ACTIVE',
      boxId: 2,
      box: { id: 2, name: 'Canil A' },
    });
    boxesRepository.findOneBy.mockResolvedValue({ id: 5, name: 'Canil B', isActive: true });
    inpatientRecordsRepository.findOne.mockResolvedValueOnce({
      id: 11,
      status: 'ACTIVE',
      boxId: 5,
    });

    await expect(
      service.transfer(10, {
        boxId: 5,
        reason: 'Aproximação da central de monitorização',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
