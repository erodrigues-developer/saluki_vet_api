import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PetsRepository } from './repositories/pets.repository';
import { Pet } from './entities/pet.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { FilterPetsDto } from './dto/filter-pets.dto';
import { ClientsService } from '../clients/clients.service';
import { SpeciesService } from '../species/species.service';
import { BreedsService } from '../breeds/breeds.service';
import { DataSource } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { ConsultationProcedure } from '../consultation-procedures/entities/consultation-procedure.entity';
import { Sale } from '../sales/entities/sale.entity';

@Injectable()
export class PetsService {
  constructor(
    private readonly petsRepository: PetsRepository,
    private readonly clientsService: ClientsService,
    private readonly speciesService: SpeciesService,
    private readonly breedsService: BreedsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: CreatePetDto): Promise<Pet> {
    await this.clientsService.findOne(payload.clientId);
    await this.speciesService.findOne(payload.speciesId);
    if (payload.breedId) {
      await this.breedsService.findOne(payload.breedId);
    }
    const pet = this.petsRepository.create(payload);
    const saved = await this.petsRepository.save(pet);
    return this.findOne(saved.id);
  }

  async findAll(filters: FilterPetsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    const { data, total } = await this.petsRepository.findPaginated({
      name: filters.name,
      clientId: filters.clientId,
      microchipCode: filters.microchipCode,
      page,
      limit,
      sortBy:
        filters.sortBy === 'createdAt'
          ? 'created_at'
          : filters.sortBy === 'updatedAt'
            ? 'updated_at'
            : filters.sortBy === 'clientId'
              ? 'client_id'
              : filters.sortBy === 'microchipCode'
                ? 'microchip_code'
                : (filters.sortBy as any),
      sortDirection:
        filters.sortDirection?.toLowerCase() === 'asc' ? 'ASC' : 'DESC',
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: number): Promise<Pet> {
    const pet = await this.petsRepository.findOne({
      where: { id },
      relations: ['client', 'species', 'breed'],
    });
    if (!pet) {
      throw new NotFoundException(`Pet ${id} not found`);
    }
    return pet;
  }

  async getHistory(id: number) {
    const pet = await this.findOne(id);

    const appointmentsRepository = this.dataSource.getRepository(Appointment);
    const consultationsRepository = this.dataSource.getRepository(Consultation);
    const consultationProceduresRepository =
      this.dataSource.getRepository(ConsultationProcedure);
    const salesRepository = this.dataSource.getRepository(Sale);

    const [appointments, consultations, consultationProcedures, sales] =
      await Promise.all([
        appointmentsRepository.find({
          where: { petId: id },
          relations: ['appointmentType', 'status'],
          order: { startsAt: 'DESC', id: 'DESC' },
        }),
        consultationsRepository.find({
          where: { petId: id },
          order: { visitDate: 'DESC', id: 'DESC' },
        }),
        consultationProceduresRepository
          .createQueryBuilder('consultationProcedure')
          .leftJoinAndSelect(
            'consultations',
            'consultation',
            'consultation.id = consultationProcedure.consultation_id',
          )
          .leftJoinAndSelect(
            'procedures',
            'procedure',
            'procedure.id = consultationProcedure.procedure_id',
          )
          .where('consultation.pet_id = :petId', { petId: id })
          .addSelect('consultation.id', 'history_consultation_id')
          .orderBy('consultation.visit_date', 'DESC')
          .addOrderBy('consultationProcedure.id', 'DESC')
          .getRawMany(),
        salesRepository.find({
          where: { clientId: Number(pet.clientId) },
          relations: [
            'items',
            'items.product',
            'items.procedure',
            'payments',
            'payments.paymentMethod',
          ],
          order: { saleDate: 'DESC', id: 'DESC' },
        }),
      ]);

    const items = [
      ...appointments.map((appointment) => ({
        id: `appointment-${appointment.id}`,
        entityId: Number(appointment.id),
        relatedEntityId: null,
        type: 'APPOINTMENT',
        title: appointment.appointmentType?.name || 'Atendimento agendado',
        description:
          String(appointment.reason || appointment.notes || '').trim() ||
          'Agendamento registrado para o paciente.',
        occurredAt: appointment.startsAt,
        status:
          appointment.status?.name || String(appointment.statusId || '').trim(),
        amount: null,
        scope: 'PET',
      })),
      ...consultations.map((consultation) => ({
        id: `consultation-${consultation.id}`,
        entityId: Number(consultation.id),
        relatedEntityId: null,
        type: 'CONSULTATION',
        title: consultation.diagnosis || 'Consulta clínica',
        description:
          String(
            consultation.treatmentPlan ||
              consultation.clinicalFindings ||
              consultation.mainComplaint ||
              consultation.notes ||
              '',
          ).trim() || 'Consulta registrada no prontuário.',
        occurredAt: consultation.visitDate,
        status: consultation.recordStatus,
        amount: null,
        scope: 'PET',
      })),
      ...consultationProcedures.map((item: any) => ({
        id: `service-${item.consultationProcedure_id}`,
        entityId: Number(item.consultationProcedure_id),
        relatedEntityId: Number(item.history_consultation_id || 0) || null,
        type: 'SERVICE',
        title: item.procedure_name || 'Serviço clínico',
        description: 'Serviço lançado no atendimento do paciente.',
        occurredAt: item.consultation_visit_date,
        status: 'COMPLETED',
        amount: Number(item.consultationProcedure_total_price || 0),
        scope: 'PET',
      })),
      ...sales.map((sale) => ({
        id: `sale-${sale.id}`,
        entityId: Number(sale.id),
        relatedEntityId: null,
        type: 'PURCHASE',
        title: `Venda #${sale.id}`,
        description:
          sale.items
            ?.map((item) => item.product?.name || item.procedure?.name)
            .filter(Boolean)
            .slice(0, 4)
            .join(', ') || 'Compra vinculada ao tutor do paciente.',
        occurredAt: sale.saleDate,
        status: sale.status,
        amount: Number(sale.totalAmount || 0),
        scope: 'CLIENT',
      })),
    ]
      .filter((item) => item.occurredAt)
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      );

    return {
      summary: {
        appointments: items.filter((item) => item.type === 'APPOINTMENT').length,
        consultations: items.filter((item) => item.type === 'CONSULTATION').length,
        services: items.filter((item) => item.type === 'SERVICE').length,
        purchases: items.filter((item) => item.type === 'PURCHASE').length,
        total: items.length,
      },
      data: items,
    };
  }

  async update(id: number, payload: UpdatePetDto): Promise<Pet> {
    if (payload.clientId) {
      await this.clientsService.findOne(payload.clientId);
    }
    if (payload.speciesId) {
      await this.speciesService.findOne(payload.speciesId);
    }
    if (payload.breedId) {
      await this.breedsService.findOne(payload.breedId);
    }
    const pet = await this.petsRepository.findOne({ where: { id } });
    if (!pet) {
      throw new NotFoundException(`Pet ${id} not found`);
    }
    const merged = this.petsRepository.merge(pet, payload);
    const saved = await this.petsRepository.save(merged);
    return this.findOne(saved.id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.petsRepository.softDelete(id);
  }
}
