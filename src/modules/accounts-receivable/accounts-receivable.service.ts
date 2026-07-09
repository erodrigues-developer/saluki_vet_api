import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AccountReceivable } from './entities/account-receivable.entity';
import { Client } from '../clients/entities/client.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { CreateAccountReceivableDto } from './dto/create-account-receivable.dto';
import { UpdateAccountReceivableDto } from './dto/update-account-receivable.dto';
import { ReceiveAccountReceivableDto } from './dto/receive-account-receivable.dto';

export interface AccountsReceivableFilterOptions {
  search?: string;
  status?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  originType?: string;
}

@Injectable()
export class AccountsReceivableService {
  constructor(
    @InjectRepository(AccountReceivable)
    private readonly repository: Repository<AccountReceivable>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodsRepository: Repository<PaymentMethod>,
  ) {}

  async create(
    dto: CreateAccountReceivableDto,
  ): Promise<AccountReceivable> {
    await this.ensureClientExists(dto.clientId);

    const entity = this.repository.create({
      ...dto,
      clientId: dto.clientId ?? null,
      status: 'PENDING',
      originType: 'MANUAL',
      paidAt: null,
      paidAmount: null,
      paymentMethodId: null,
    });

    return this.repository.save(entity);
  }

  async update(
    id: number,
    dto: UpdateAccountReceivableDto,
  ): Promise<AccountReceivable> {
    const entity = await this.findManagedAccount(id);

    this.ensureEditableOrigin(entity);
    await this.ensureClientExists(dto.clientId);

    const merged = this.repository.merge(entity, dto, {
      clientId: dto.clientId ?? entity.clientId,
    });

    return this.repository.save(merged);
  }

  async findAll(filters: AccountsReceivableFilterOptions) {
    const query = this.createBaseQuery();
    this.applyFilters(query, filters);
    query.orderBy('ar.dueDate', 'ASC').addOrderBy('ar.id', 'DESC');

    const data = await query.getMany();
    return { data };
  }

  async markAsReceived(
    id: number,
    dto: ReceiveAccountReceivableDto,
  ): Promise<AccountReceivable> {
    const entity = await this.findManagedAccount(id);

    this.ensureEditableOrigin(entity);

    if (entity.status === 'PAID') {
      throw new ConflictException('Account already received');
    }

    const paymentMethod = await this.paymentMethodsRepository.findOneBy({
      id: dto.paymentMethodId,
    });

    if (!paymentMethod || !paymentMethod.isActive) {
      throw new BadRequestException('Payment method not found or inactive');
    }

    entity.status = 'PAID';
    entity.paidAt = dto.paidAt;
    entity.paidAmount = dto.paidAmount;
    entity.paymentMethodId = dto.paymentMethodId;

    if (dto.note?.trim()) {
      entity.notes = [entity.notes?.trim(), `[Recebimento] ${dto.note.trim()}`]
        .filter(Boolean)
        .join('\n');
    }

    return this.repository.save(entity);
  }

  async undoReceive(id: number): Promise<AccountReceivable> {
    const entity = await this.findManagedAccount(id);

    this.ensureEditableOrigin(entity);

    if (entity.status !== 'PAID') {
      throw new ConflictException('Only paid accounts can be reverted');
    }

    entity.status = 'PENDING';
    entity.paidAt = null;
    entity.paidAmount = null;
    entity.paymentMethodId = null;

    return this.repository.save(entity);
  }

  async getDashboardMetrics(filters: AccountsReceivableFilterOptions) {
    const query = this.createBaseQuery();
    this.applyFilters(query, filters);

    const allReceivables = await query.getMany();

    let totalPending = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    let expectedTotal = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const originData: Record<string, number> = {};
    const flowData: Record<
      string,
      { paid: number; pending: number; overdue: number }
    > = {};

    for (const receivable of allReceivables) {
      const amount = Number(receivable.amount);
      expectedTotal += amount;

      const due = new Date(receivable.dueDate);
      const isOverdue =
        receivable.status === 'PENDING' && due.valueOf() < now.valueOf();

      if (receivable.status === 'PAID') {
        totalPaid += Number(receivable.paidAmount || receivable.amount);
      } else {
        totalPending += amount;
        if (isOverdue) {
          totalOverdue += amount;
        }
      }

      const originKey =
        receivable.originType === 'SALE' ? 'Vendas' : 'Lançamentos manuais';
      originData[originKey] = (originData[originKey] || 0) + amount;

      const day = String(due.getDate());
      if (!flowData[day]) {
        flowData[day] = { paid: 0, pending: 0, overdue: 0 };
      }

      if (receivable.status === 'PAID') {
        flowData[day].paid += Number(
          receivable.paidAmount || receivable.amount,
        );
      } else if (isOverdue) {
        flowData[day].overdue += amount;
      } else {
        flowData[day].pending += amount;
      }
    }

    return {
      data: {
        kpis: {
          totalPending,
          totalPaid,
          totalOverdue,
          expectedTotal,
        },
        charts: {
          originPie: Object.entries(originData).map(([name, value]) => ({
            name,
            value,
          })),
          flowBar: Object.entries(flowData)
            .map(([day, data]) => ({
              day: Number(day),
              ...data,
            }))
            .sort((a, b) => a.day - b.day),
        },
      },
    };
  }

  private createBaseQuery(): SelectQueryBuilder<AccountReceivable> {
    return this.repository
      .createQueryBuilder('ar')
      .leftJoinAndSelect('ar.client', 'client')
      .leftJoinAndSelect('ar.sale', 'sale')
      .leftJoinAndSelect('ar.paymentMethod', 'paymentMethod');
  }

  private applyFilters(
    query: SelectQueryBuilder<AccountReceivable>,
    filters: AccountsReceivableFilterOptions,
  ): void {
    if (filters.search?.trim()) {
      query.andWhere(
        '(ar.description ILIKE :search OR client.name ILIKE :search OR CAST(ar.saleId AS TEXT) ILIKE :search)',
        { search: `%${filters.search.trim()}%` },
      );
    }

    if (filters.clientId) {
      query.andWhere('ar.clientId = :clientId', { clientId: filters.clientId });
    }

    if (filters.startDate) {
      query.andWhere('ar.dueDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere('ar.dueDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.originType && filters.originType !== 'ALL') {
      query.andWhere('ar.originType = :originType', {
        originType: filters.originType,
      });
    }

    this.applyStatusFilter(query, filters.status);
  }

  private applyStatusFilter(
    query: SelectQueryBuilder<AccountReceivable>,
    status?: string,
  ): void {
    if (!status || status === 'ALL') {
      return;
    }

    if (status === 'OVERDUE') {
      query.andWhere('ar.status = :pendingStatus', {
        pendingStatus: 'PENDING',
      });
      query.andWhere('ar.dueDate < CURRENT_DATE');
      return;
    }

    query.andWhere('ar.status = :status', { status });
  }

  private async findManagedAccount(id: number): Promise<AccountReceivable> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['client', 'sale', 'paymentMethod'],
    });

    if (!entity) {
      throw new NotFoundException('Account not found');
    }

    return entity;
  }

  private async ensureClientExists(clientId?: number): Promise<void> {
    if (!clientId) {
      return;
    }

    const client = await this.clientsRepository.findOneBy({ id: clientId });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }

  private ensureEditableOrigin(entity: AccountReceivable): void {
    if (entity.originType === 'SALE' || entity.saleId) {
      throw new BadRequestException(
        'Receivables generated from sales must be managed through the sales flow.',
      );
    }
  }
}
