import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AccountPayable } from './entities/account-payable.entity';
import { CreateAccountPayableDto } from './dto/create-account-payable.dto';
import { PayAccountDto } from './dto/pay-account.dto';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { UpdateAccountPayableDto } from './dto/update-account-payable.dto';

@Injectable()
export class AccountsPayableService {
  constructor(
    @InjectRepository(AccountPayable)
    private readonly repository: Repository<AccountPayable>,
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
  ) {}

  async create(dto: CreateAccountPayableDto): Promise<AccountPayable> {
    await this.ensureSupplierExists(dto.supplierId);

    const entity = this.repository.create({
      ...dto,
      status: 'PENDING',
    });
    return this.repository.save(entity);
  }

  async update(
    id: number,
    dto: UpdateAccountPayableDto,
  ): Promise<AccountPayable> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) throw new NotFoundException('Account not found');

    if (dto.supplierId !== undefined) {
      await this.ensureSupplierExists(dto.supplierId);
    }

    const merged = this.repository.merge(entity, dto);
    return this.repository.save(merged);
  }

  async findAll(
    category?: string,
    month?: number,
    year?: number,
    status?: string,
  ): Promise<AccountPayable[]> {
    const query = this.repository
      .createQueryBuilder('ap')
      .leftJoinAndSelect('ap.supplier', 'supplier');

    if (category) {
      query.andWhere('ap.category = :category', { category: category });
    }

    if (month && year) {
      query.andWhere('EXTRACT(MONTH FROM ap.dueDate) = :month', { month });
      query.andWhere('EXTRACT(YEAR FROM ap.dueDate) = :year', { year });
    }

    this.applyStatusFilter(query, status);

    query.orderBy('ap.dueDate', 'ASC');

    return query.getMany();
  }

  async markAsPaid(id: number, dto: PayAccountDto): Promise<AccountPayable> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) throw new NotFoundException('Account not found');

    entity.status = 'PAID';
    entity.paidAt = dto.paidAt;
    entity.paidAmount = dto.paidAmount;
    entity.paymentMethod = dto.paymentMethod;

    return this.repository.save(entity);
  }

  async undoPayment(id: number): Promise<AccountPayable> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) throw new NotFoundException('Account not found');

    entity.status = 'PENDING';
    entity.paidAt = null;
    entity.paidAmount = null;
    entity.paymentMethod = null;

    return this.repository.save(entity);
  }

  async getDashboardMetrics(
    month?: number,
    year?: number,
    category?: string,
    status?: string,
  ) {
    const query = this.repository.createQueryBuilder('ap');

    if (month && year) {
      query.andWhere('EXTRACT(MONTH FROM ap.dueDate) = :month', { month });
      query.andWhere('EXTRACT(YEAR FROM ap.dueDate) = :year', { year });
    }
    if (category && category !== 'Todas as Despesas') {
      query.andWhere('ap.category = :category', { category });
    }
    this.applyStatusFilter(query, status);

    const allPayables = await query.getMany();

    let totalPending = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    let expectedTotal = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const categoryData: Record<string, number> = {};
    const flowData: Record<
      string,
      { paid: number; pending: number; overdue: number }
    > = {};

    for (const ap of allPayables) {
      const amount = Number(ap.amount);
      expectedTotal += amount;

      const due = new Date(ap.dueDate);

      const isOverdue =
        ap.status === 'PENDING' && due.valueOf() < now.valueOf();

      if (ap.status === 'PAID') {
        const paidAmount = Number(ap.paidAmount || ap.amount);
        totalPaid += paidAmount;
      } else if (ap.status === 'PENDING') {
        totalPending += amount;
        if (isOverdue) totalOverdue += amount;
      }

      const cat = ap.category || 'Sem Categoria';
      if (!categoryData[cat]) categoryData[cat] = 0;
      categoryData[cat] += amount;

      const day = due.getDate();
      if (!flowData[day]) flowData[day] = { paid: 0, pending: 0, overdue: 0 };

      if (ap.status === 'PAID') {
        flowData[day].paid += Number(ap.paidAmount || ap.amount);
      } else {
        if (isOverdue) {
          flowData[day].overdue += amount;
        } else {
          flowData[day].pending += amount;
        }
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
          categoryPie: Object.entries(categoryData).map(([name, value]) => ({
            name,
            value,
          })),
          flowBar: Object.entries(flowData)
            .map(([day, data]) => ({
              day: parseInt(day),
              ...data,
            }))
            .sort((a, b) => a.day - b.day),
        },
      },
    };
  }

  private applyStatusFilter(
    query: SelectQueryBuilder<AccountPayable>,
    status?: string,
  ): void {
    if (!status || status === 'ALL') {
      return;
    }

    if (status === 'OVERDUE') {
      query.andWhere('ap.status = :pendingStatus', { pendingStatus: 'PENDING' });
      query.andWhere('ap.dueDate < CURRENT_DATE');
      return;
    }

    query.andWhere('ap.status = :status', { status });
  }

  private async ensureSupplierExists(supplierId: number): Promise<void> {
    const supplier = await this.suppliersRepository.findOneBy({ id: supplierId });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
  }
}
