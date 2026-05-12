import { BadRequestException } from '@nestjs/common';
import { ClinicalParametersService } from './clinical-parameters.service';

describe('ClinicalParametersService', () => {
  let service: ClinicalParametersService;
  let repository: any;
  let inpatientRecordsService: any;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    inpatientRecordsService = {
      ensureActiveRecord: jest.fn(),
    };

    service = new ClinicalParametersService(
      repository,
      inpatientRecordsService,
    );
  });

  it('should require at least one parameter value', async () => {
    inpatientRecordsService.ensureActiveRecord.mockResolvedValue({ id: 1 });

    await expect(service.create(1, {}, 3)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should create a parameter feed item with current user id', async () => {
    inpatientRecordsService.ensureActiveRecord.mockResolvedValue({ id: 1 });
    repository.create.mockReturnValue({ inpatientRecordId: 1 });
    repository.save.mockResolvedValue({ id: 4 });
    repository.findOne.mockResolvedValue({
      id: 4,
      createdByUser: { id: 3, name: 'Admin' },
    });

    const result = await service.create(
      1,
      { temperatureC: 38.7, notes: 'Estavel' },
      3,
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        inpatientRecordId: 1,
        createdByUserId: 3,
      }),
    );
    expect(result.id).toBe(4);
  });
});
