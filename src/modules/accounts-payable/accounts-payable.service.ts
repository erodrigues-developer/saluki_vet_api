import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AccountPayable } from './entities/account-payable.entity';
import { CreateAccountPayableDto } from './dto/create-account-payable.dto';
import { PayAccountDto } from './dto/pay-account.dto';
import { Supplier } from '../suppliers/entities/supplier.entity';
import {
  UpdateAccountPayableWithScopeDto,
} from './dto/update-account-payable.dto';
import { User } from '../users/entities/user.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { AccountPayableRecurrence } from './entities/account-payable-recurrence.entity';
import { ClinicSettingsService } from '../clinic-settings/clinic-settings.service';

@Injectable()
export class AccountsPayableService {
  private readonly logger = new Logger(AccountsPayableService.name);
  private isSyncingRecurrences = false;

  constructor(
    @InjectRepository(AccountPayable)
    private readonly repository: Repository<AccountPayable>,
    @InjectRepository(AccountPayableRecurrence)
    private readonly recurrencesRepository: Repository<AccountPayableRecurrence>,
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodsRepository: Repository<PaymentMethod>,
    private readonly commissionsService: CommissionsService,
    private readonly clinicSettingsService: ClinicSettingsService,
  ) {}

  async create(dto: CreateAccountPayableDto): Promise<AccountPayable> {
    this.ensureManualAccountHasCounterparty(
      dto.originType,
      dto.supplierId,
      dto.beneficiaryUserId,
    );
    this.ensureRecurringOriginAllowed(dto);
    this.ensureRecurrencePayload(dto.recurrence);
    await this.ensureRelatedParties(dto.supplierId, dto.beneficiaryUserId);

    if (dto.recurrence?.enabled) {
      const recurrence = await this.createRecurrenceFromDto(dto);
      await this.ensureRecurrenceWindow(recurrence.id);
      const created = await this.repository.findOne({
        where: {
          recurrenceId: recurrence.id,
          recurrenceSequence: 1,
        },
        relations: {
          recurrence: true,
          supplier: true,
          beneficiaryUser: true,
          paymentMethodRelation: true,
        },
      });

      if (!created) {
        throw new NotFoundException('Unable to create recurring account');
      }

      return created;
    }

    const entity = this.repository.create({
      ...dto,
      status: 'PENDING',
      originType: dto.originType || 'MANUAL',
      recurrenceId: null,
      recurrenceSequence: null,
      isRecurrenceGenerated: false,
    });
    return this.repository.save(entity);
  }

  async update(
    id: number,
    dto: UpdateAccountPayableWithScopeDto & {
      beneficiaryUserId?: number | null;
      originType?: string;
      originReferenceId?: number | null;
    },
  ): Promise<AccountPayable> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: {
        recurrence: true,
      },
    });
    if (!entity) throw new NotFoundException('Account not found');

    this.ensureManualAccountHasCounterparty(
      dto.originType || entity.originType,
      dto.supplierId !== undefined ? dto.supplierId : entity.supplierId,
      dto.beneficiaryUserId !== undefined
        ? dto.beneficiaryUserId
        : entity.beneficiaryUserId,
    );
    this.ensureRecurringOriginAllowed({
      ...entity,
      ...dto,
      recurrence: dto.recurrence,
    } as CreateAccountPayableDto);
    this.ensureRecurrencePayload(dto.recurrence);
    await this.ensureRelatedParties(dto.supplierId, dto.beneficiaryUserId);

    if (entity.recurrenceId && dto.scope === 'THIS_AND_NEXT') {
      await this.updateRecurrenceSeries(entity, dto);
      return this.findOneOrFail(id);
    }

    const { recurrence: _recurrence, scope: _scope, ...payload } = dto as any;
    const merged = this.repository.merge(entity, payload);

    if (dto.recurrence?.enabled === false && entity.recurrenceId) {
      merged.recurrenceId = null;
      merged.recurrenceSequence = null;
      merged.isRecurrenceGenerated = false;
    }

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
      .leftJoinAndSelect('ap.supplier', 'supplier')
      .leftJoinAndSelect('ap.beneficiaryUser', 'beneficiaryUser')
      .leftJoinAndSelect('ap.paymentMethodRelation', 'paymentMethodRelation')
      .leftJoinAndSelect('ap.recurrence', 'recurrence');

    if (category) {
      query.andWhere('ap.category = :category', { category });
    }

    if (month && year) {
      query.andWhere('EXTRACT(MONTH FROM ap.dueDate) = :month', { month });
      query.andWhere('EXTRACT(YEAR FROM ap.dueDate) = :year', { year });
    }

    this.applyStatusFilter(query, status);

    query.orderBy('ap.dueDate', 'ASC').addOrderBy('ap.id', 'ASC');

    return query.getMany();
  }

  async markAsPaid(id: number, dto: PayAccountDto): Promise<AccountPayable> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) throw new NotFoundException('Account not found');

    if (entity.status === 'CANCELED') {
      throw new BadRequestException(
        'Não é possível registrar pagamento em uma conta cancelada.',
      );
    }

    const paymentData = await this.resolvePaymentMethod(dto);
    const paidAt = new Date(dto.paidAt);
    if (Number.isNaN(paidAt.getTime())) {
      throw new BadRequestException('Data de pagamento inválida.');
    }

    entity.status = 'PAID';
    entity.paidAt = paidAt;
    entity.paidAmount = Number(dto.paidAmount);
    entity.paymentMethodId = paymentData.paymentMethodId;
    entity.paymentMethod = paymentData.paymentMethod;

    const saved = await this.repository.save(entity);

    if (saved.originType === 'COMMISSION_PAYOUT') {
      await this.commissionsService.markPayoutAsPaidByAccountPayable(
        saved.id,
        paidAt,
      );
    }

    return saved;
  }

  async undoPayment(id: number): Promise<AccountPayable> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) throw new NotFoundException('Account not found');

    entity.status = 'PENDING';
    entity.paidAt = null;
    entity.paidAmount = null;
    entity.paymentMethodId = null;
    entity.paymentMethod = null;

    const saved = await this.repository.save(entity);

    if (saved.originType === 'COMMISSION_PAYOUT') {
      await this.commissionsService.reopenPayoutByAccountPayable(saved.id);
    }

    return saved;
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
      if (ap.status !== 'CANCELED') {
        expectedTotal += amount;
      }

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
      } else if (ap.status === 'PENDING') {
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

  @Cron('0 10 1 * * *')
  async syncRecurringAccountsWindow() {
    if (this.isSyncingRecurrences) {
      return;
    }

    this.isSyncingRecurrences = true;

    try {
      const recurrences = await this.recurrencesRepository.find({
        where: { isActive: true },
        order: { id: 'ASC' },
      });

      for (const recurrence of recurrences) {
        await this.ensureRecurrenceWindow(recurrence.id);
      }
    } catch (error: any) {
      this.logger.error(
        'Failed to synchronize accounts payable recurrences',
        error?.stack,
      );
    } finally {
      this.isSyncingRecurrences = false;
    }
  }

  private async createRecurrenceFromDto(
    dto: CreateAccountPayableDto,
  ): Promise<AccountPayableRecurrence> {
    const firstDueDate = this.normalizeDateOnly(dto.dueDate);
    const recurrence = this.recurrencesRepository.create({
      description: dto.description,
      category: dto.category ?? null,
      amount: dto.amount,
      supplierId: dto.supplierId ?? null,
      beneficiaryUserId: dto.beneficiaryUserId ?? null,
      frequency: dto.recurrence!.frequency,
      intervalCount: dto.recurrence!.intervalCount,
      firstDueDate,
      endsAt: dto.recurrence!.endsAt
        ? this.normalizeDateOnly(dto.recurrence!.endsAt)
        : null,
      occurrencesLimit: dto.recurrence!.occurrencesLimit ?? null,
      nextDueDate: firstDueDate,
      lastGeneratedDueDate: null,
      isActive: true,
      notes: dto.notes ?? null,
      originType: dto.originType || 'MANUAL',
      originReferenceId: dto.originReferenceId ?? null,
    });

    return this.recurrencesRepository.save(recurrence);
  }

  private async updateRecurrenceSeries(
    entity: AccountPayable,
    dto: UpdateAccountPayableWithScopeDto,
  ) {
    const recurrence = await this.recurrencesRepository.findOneBy({
      id: entity.recurrenceId!,
    });

    if (!recurrence) {
      throw new NotFoundException('Recurrence not found');
    }

    recurrence.description = dto.description ?? recurrence.description;
    recurrence.category =
      dto.category !== undefined ? dto.category : recurrence.category;
    recurrence.amount =
      dto.amount !== undefined ? Number(dto.amount) : recurrence.amount;
    recurrence.supplierId =
      dto.supplierId !== undefined ? dto.supplierId : recurrence.supplierId;
    recurrence.beneficiaryUserId =
      dto.beneficiaryUserId !== undefined
        ? dto.beneficiaryUserId
        : recurrence.beneficiaryUserId;
    recurrence.notes = dto.notes !== undefined ? dto.notes : recurrence.notes;

    if (dto.recurrence?.enabled) {
      recurrence.frequency = dto.recurrence.frequency;
      recurrence.intervalCount = dto.recurrence.intervalCount;
      recurrence.endsAt = dto.recurrence.endsAt
        ? this.normalizeDateOnly(dto.recurrence.endsAt)
        : null;
      recurrence.occurrencesLimit = dto.recurrence.occurrencesLimit ?? null;
    } else if (dto.recurrence?.enabled === false) {
      recurrence.isActive = false;
    }

    await this.recurrencesRepository.save(recurrence);

    if (dto.recurrence?.enabled !== false) {
      const futurePendingAccounts = await this.repository
        .createQueryBuilder('ap')
        .where('ap.recurrence_id = :recurrenceId', {
          recurrenceId: recurrence.id,
        })
        .andWhere('ap.status = :status', { status: 'PENDING' })
        .andWhere('ap.due_date >= :dueDate', {
          dueDate: this.normalizeDateOnly(entity.dueDate),
        })
        .getMany();

      for (const account of futurePendingAccounts) {
        account.description = recurrence.description;
        account.category = recurrence.category ?? null;
        account.amount = recurrence.amount;
        account.supplierId = recurrence.supplierId ?? null;
        account.beneficiaryUserId = recurrence.beneficiaryUserId ?? null;
        account.notes = recurrence.notes ?? null;
        await this.repository.save(account);
      }
    }

    await this.ensureRecurrenceWindow(recurrence.id);
  }

  private async ensureRecurrenceWindow(recurrenceId: number) {
    const recurrence = await this.recurrencesRepository.findOneBy({
      id: recurrenceId,
    });

    if (!recurrence || !recurrence.isActive) {
      return;
    }

    const horizonMonths =
      (await this.clinicSettingsService.getSettings())
        .accountsPayableRecurrenceHorizonMonths || 12;
    const firstDueDate = this.normalizeDateOnly(recurrence.firstDueDate);
    const projectionLimit = this.addMonths(firstDueDate, horizonMonths - 1);

    let cursor = recurrence.nextDueDate
      ? this.normalizeDateOnly(recurrence.nextDueDate)
      : firstDueDate;
    let sequence = await this.countExistingOccurrences(recurrence.id);

    while (cursor.getTime() <= projectionLimit.getTime()) {
      if (!this.canGenerateOccurrence(recurrence, cursor, sequence + 1)) {
        recurrence.isActive = recurrence.endsAt
          ? cursor.getTime() <= this.normalizeDateOnly(recurrence.endsAt).getTime()
          : recurrence.isActive;
        break;
      }

      const existing = await this.repository.findOneBy({
        recurrenceId: recurrence.id,
        dueDate: cursor,
      });

      if (!existing) {
        const entity = this.repository.create({
          description: recurrence.description,
          category: recurrence.category ?? null,
          amount: recurrence.amount,
          dueDate: cursor,
          supplierId: recurrence.supplierId ?? null,
          beneficiaryUserId: recurrence.beneficiaryUserId ?? null,
          status: 'PENDING',
          originType: recurrence.originType || 'MANUAL',
          originReferenceId: recurrence.originReferenceId ?? null,
          notes: recurrence.notes ?? null,
          recurrenceId: recurrence.id,
          recurrenceSequence: sequence + 1,
          isRecurrenceGenerated: true,
        });
        await this.repository.save(entity);
        sequence += 1;
        recurrence.lastGeneratedDueDate = cursor;
      } else {
        sequence = Math.max(sequence, Number(existing.recurrenceSequence || 0));
      }

      cursor = this.advanceDate(
        cursor,
        recurrence.frequency,
        recurrence.intervalCount,
      );
      recurrence.nextDueDate = cursor;
    }

    await this.recurrencesRepository.save(recurrence);
  }

  private async countExistingOccurrences(recurrenceId: number): Promise<number> {
    return this.repository.count({
      where: { recurrenceId },
    });
  }

  private canGenerateOccurrence(
    recurrence: AccountPayableRecurrence,
    dueDate: Date,
    occurrenceNumber: number,
  ): boolean {
    if (
      recurrence.endsAt &&
      dueDate.getTime() > this.normalizeDateOnly(recurrence.endsAt).getTime()
    ) {
      return false;
    }

    if (
      recurrence.occurrencesLimit &&
      occurrenceNumber > Number(recurrence.occurrencesLimit)
    ) {
      return false;
    }

    return true;
  }

  private advanceDate(date: Date, frequency: string, intervalCount: number) {
    const cursor = new Date(date.getTime());

    if (frequency === 'WEEKLY') {
      cursor.setDate(cursor.getDate() + intervalCount * 7);
      return cursor;
    }

    if (frequency === 'YEARLY') {
      cursor.setFullYear(cursor.getFullYear() + intervalCount);
      return cursor;
    }

    cursor.setMonth(cursor.getMonth() + intervalCount);
    return cursor;
  }

  private addMonths(date: Date, months: number) {
    const cloned = new Date(date.getTime());
    cloned.setMonth(cloned.getMonth() + months);
    return cloned;
  }

  private normalizeDateOnly(rawDate: string | Date): Date {
    const date =
      rawDate instanceof Date
        ? new Date(rawDate.getTime())
        : new Date(`${rawDate}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Data inválida para recorrência.');
    }

    date.setHours(0, 0, 0, 0);
    return date;
  }

  private applyStatusFilter(
    query: SelectQueryBuilder<AccountPayable>,
    status?: string,
  ): void {
    if (!status || status === 'ALL') {
      return;
    }

    if (status === 'OVERDUE') {
      query.andWhere('ap.status = :pendingStatus', {
        pendingStatus: 'PENDING',
      });
      query.andWhere('ap.dueDate < CURRENT_DATE');
      return;
    }

    query.andWhere('ap.status = :status', { status });
  }

  private async ensureRelatedParties(
    supplierId?: number | null,
    beneficiaryUserId?: number | null,
  ): Promise<void> {
    if (supplierId) {
      const supplier = await this.suppliersRepository.findOneBy({
        id: supplierId,
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }
    }

    if (beneficiaryUserId) {
      const user = await this.usersRepository.findOneBy({
        id: beneficiaryUserId,
      });

      if (!user) {
        throw new NotFoundException('Beneficiary user not found');
      }
    }
  }

  private ensureManualAccountHasCounterparty(
    originType: string | undefined,
    supplierId?: number | null,
    beneficiaryUserId?: number | null,
  ) {
    if (originType === 'COMMISSION_PAYOUT') {
      return;
    }

    if (!supplierId && !beneficiaryUserId) {
      throw new BadRequestException(
        'Informe um fornecedor ou beneficiário para a conta a pagar.',
      );
    }
  }

  private ensureRecurringOriginAllowed(dto: CreateAccountPayableDto) {
    if (dto.recurrence?.enabled && dto.originType === 'COMMISSION_PAYOUT') {
      throw new BadRequestException(
        'Contas de comissão não podem ser recorrentes.',
      );
    }
  }

  private ensureRecurrencePayload(recurrence?: CreateAccountPayableDto['recurrence']) {
    if (!recurrence?.enabled) {
      return;
    }

    if (!recurrence.frequency || !recurrence.intervalCount) {
      throw new BadRequestException(
        'Periodicidade e intervalo são obrigatórios para recorrência.',
      );
    }
  }

  private async findOneOrFail(id: number) {
    const entity = await this.repository.findOne({
      where: { id },
      relations: {
        recurrence: true,
        supplier: true,
        beneficiaryUser: true,
        paymentMethodRelation: true,
      },
    });

    if (!entity) {
      throw new NotFoundException('Account not found');
    }

    return entity;
  }

  private async resolvePaymentMethod(
    dto: PayAccountDto,
  ): Promise<{ paymentMethodId: number | null; paymentMethod: string | null }> {
    if (dto.paymentMethodId) {
      const paymentMethod = await this.paymentMethodsRepository.findOne({
        where: { id: dto.paymentMethodId },
      });

      if (!paymentMethod || !paymentMethod.isActive) {
        throw new BadRequestException(
          'Forma de pagamento inexistente ou inativa.',
        );
      }

      return {
        paymentMethodId: paymentMethod.id,
        paymentMethod: paymentMethod.name,
      };
    }

    if (dto.paymentMethod) {
      return {
        paymentMethodId: null,
        paymentMethod: dto.paymentMethod,
      };
    }

    throw new BadRequestException('Forma de pagamento é obrigatória.');
  }
}
