import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let repository: any;
  let petsRepository: any;
  let usersRepository: any;
  let consultationsRepository: any;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    petsRepository = { findOne: jest.fn() };
    usersRepository = { findOne: jest.fn() };
    consultationsRepository = { findOneBy: jest.fn() };

    service = new PrescriptionsService(
      repository,
      petsRepository,
      usersRepository,
      consultationsRepository,
    );
  });

  it('should create prescription using authenticated user as veterinarian', async () => {
    petsRepository.findOne.mockResolvedValue({ id: 1 });
    usersRepository.findOne.mockResolvedValue({ id: 3, isActive: true });
    repository.create.mockReturnValue({ petId: 1, veterinarianId: 3 });
    repository.save.mockResolvedValue({ id: 11 });
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 11 } as any);

    const result = await service.create(
      {
        petId: 1,
        content: 'Dipirona 1 gota/kg',
      },
      3,
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        petId: 1,
        veterinarianId: 3,
      }),
    );
    expect(result.id).toBe(11);
  });

  it('should reject when veterinarian cannot be resolved', async () => {
    petsRepository.findOne.mockResolvedValue({ id: 1 });

    await expect(
      service.create({ petId: 1, content: 'abc' }, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject when consultation belongs to another pet', async () => {
    petsRepository.findOne.mockResolvedValue({ id: 1 });
    usersRepository.findOne.mockResolvedValue({ id: 3, isActive: true });
    consultationsRepository.findOneBy.mockResolvedValue({ id: 4, petId: 99 });

    await expect(
      service.create(
        {
          petId: 1,
          consultationId: 4,
          content: 'abc',
        },
        3,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when prescription is not found', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(44)).rejects.toBeInstanceOf(NotFoundException);
  });
});
