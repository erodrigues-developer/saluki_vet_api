import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { FilterPrescriptionsDto } from './dto/filter-prescriptions.dto';
import { Pet } from '../pets/entities/pet.entity';
import { User } from '../users/entities/user.entity';
import { Consultation } from '../consultations/entities/consultation.entity';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionsRepository: Repository<Prescription>,
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Consultation)
    private readonly consultationsRepository: Repository<Consultation>,
  ) {}

  async create(payload: CreatePrescriptionDto, currentUserId?: number) {
    const pet = await this.petsRepository.findOne({
      where: { id: payload.petId },
      relations: {
        client: true,
      },
    });
    if (!pet) {
      throw new NotFoundException(`Pet ${payload.petId} not found`);
    }

    const veterinarianId = payload.veterinarianId ?? currentUserId;
    if (!veterinarianId) {
      throw new BadRequestException('Veterinarian could not be resolved');
    }

    const veterinarian = await this.usersRepository.findOne({
      where: { id: veterinarianId },
      relations: {
        roles: true,
      },
    });
    if (!veterinarian || !veterinarian.isActive) {
      throw new NotFoundException(`User ${veterinarianId} not found`);
    }

    if (payload.consultationId) {
      const consultation = await this.consultationsRepository.findOneBy({
        id: payload.consultationId,
      });
      if (!consultation) {
        throw new NotFoundException(
          `Consultation ${payload.consultationId} not found`,
        );
      }
      if (Number(consultation.petId) !== Number(payload.petId)) {
        throw new BadRequestException(
          'Consultation does not belong to the informed pet',
        );
      }
    }

    const entity = this.prescriptionsRepository.create({
      ...payload,
      veterinarianId,
      prescribedAt: payload.prescribedAt
        ? new Date(payload.prescribedAt)
        : new Date(),
      expirationDate: payload.expirationDate
        ? new Date(payload.expirationDate)
        : null,
    });

    const saved = await this.prescriptionsRepository.save(entity);
    return this.findOne(saved.id);
  }

  async findAll(filters: FilterPrescriptionsDto) {
    const query = this.prescriptionsRepository
      .createQueryBuilder('prescription')
      .leftJoinAndSelect('prescription.pet', 'pet')
      .leftJoinAndSelect('pet.client', 'client')
      .leftJoinAndSelect('prescription.veterinarian', 'veterinarian')
      .leftJoinAndSelect('prescription.consultation', 'consultation')
      .orderBy('prescription.prescribedAt', 'DESC')
      .addOrderBy('prescription.id', 'DESC');

    if (filters.petId) {
      query.andWhere('prescription.petId = :petId', { petId: filters.petId });
    }

    if (filters.consultationId) {
      query.andWhere('prescription.consultationId = :consultationId', {
        consultationId: filters.consultationId,
      });
    }

    return {
      data: await query.getMany(),
    };
  }

  async findOne(id: number) {
    const prescription = await this.prescriptionsRepository.findOne({
      where: { id },
      relations: {
        pet: {
          client: true,
        },
        veterinarian: true,
        consultation: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription ${id} not found`);
    }

    return prescription;
  }
}
