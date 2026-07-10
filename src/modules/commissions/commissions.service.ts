import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, In, IsNull } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sale-items/entities/sale-item.entity';
import { Commission } from './entities/commission.entity';
import {
  CommissionsFilterOptions,
  CommissionsRepository,
} from './repositories/commissions.repository';
import { PreviewCommissionPayoutDto } from './dto/preview-commission-payout.dto';
import { CommissionPayout } from './entities/commission-payout.entity';
import { CommissionPayoutItem } from './entities/commission-payout-item.entity';
import { User } from '../users/entities/user.entity';
import { AccountPayable } from '../accounts-payable/entities/account-payable.entity';
import { PayAccountDto } from '../accounts-payable/dto/pay-account.dto';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';

interface CommissionPayoutFilters {
  page: number;
  limit: number;
  status?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export interface CommissionPayoutTotals {
  grossAmount: number;
  adjustmentAmount: number;
  netAmount: number;
}

@Injectable()
export class CommissionsService {
  constructor(
    private readonly commissionsRepository: CommissionsRepository,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(filters: CommissionsFilterOptions) {
    return this.commissionsRepository.findPaginated(filters);
  }

  async getSummary(filters: Omit<CommissionsFilterOptions, 'page' | 'limit'>) {
    return this.commissionsRepository.summarize(filters);
  }

  async findPayouts(filters: CommissionPayoutFilters) {
    const repository = this.dataSource.getRepository(CommissionPayout);
    const query = repository
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.user', 'user')
      .leftJoinAndSelect('payout.accountPayable', 'accountPayable')
      .leftJoinAndSelect(
        'accountPayable.paymentMethodRelation',
        'paymentMethodRelation',
      )
      .orderBy('payout.createdAt', 'DESC')
      .addOrderBy('payout.id', 'DESC')
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit);

    if (filters.status) {
      query.andWhere('payout.status = :status', { status: filters.status });
    }

    if (filters.userId) {
      query.andWhere('payout.userId = :userId', { userId: filters.userId });
    }

    if (filters.startDate) {
      query.andWhere('payout.periodEnd >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere('payout.periodStart <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const [data, total] = await query.getManyAndCount();
    return {
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
      },
    };
  }

  async findPayoutById(id: number, manager?: EntityManager) {
    const repository = (manager || this.dataSource.manager).getRepository(
      CommissionPayout,
    );
    const payout = await repository.findOne({
      where: { id },
      relations: [
        'user',
        'accountPayable',
        'accountPayable.paymentMethodRelation',
        'items',
        'items.commission',
        'items.commission.sale',
        'items.commission.procedure',
      ],
      order: {
        items: {
          id: 'ASC',
        },
      },
    });

    if (!payout) {
      throw new NotFoundException(`Commission payout with ID ${id} not found`);
    }

    return payout;
  }

  async previewPayout(payload: PreviewCommissionPayoutDto) {
    const dates = this.resolvePeriod(payload);
    const commissions = await this.getEligibleCommissions(
      this.dataSource.manager,
      payload.userId,
      dates.periodStart,
      dates.periodEnd,
    );

    if (!commissions.length) {
      throw new BadRequestException(
        'Nenhuma comissão elegível encontrada para o período informado.',
      );
    }

    const totals = this.computePayoutTotals(commissions);
    if (totals.netAmount <= 0) {
      throw new BadRequestException(
        'O total líquido do pagamento deve ser maior que zero.',
      );
    }

    return {
      data: {
        userId: payload.userId,
        periodStart: dates.periodStart.toISOString().slice(0, 10),
        periodEnd: dates.periodEnd.toISOString().slice(0, 10),
        totals,
        commissions,
      },
    };
  }

  async createPayout(payload: PreviewCommissionPayoutDto) {
    const dates = this.resolvePeriod(payload);

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const payoutRepository = manager.getRepository(CommissionPayout);
      const payoutItemRepository = manager.getRepository(CommissionPayoutItem);
      const accountPayableRepository = manager.getRepository(AccountPayable);
      const commissionRepository = manager.getRepository(Commission);

      const user = await userRepository.findOne({
        where: { id: payload.userId },
      });
      if (!user) {
        throw new NotFoundException('Profissional não encontrado.');
      }

      const commissions = await this.getEligibleCommissions(
        manager,
        payload.userId,
        dates.periodStart,
        dates.periodEnd,
      );

      if (!commissions.length) {
        throw new BadRequestException(
          'Nenhuma comissão elegível encontrada para geração do pagamento.',
        );
      }

      const totals = this.computePayoutTotals(commissions);
      if (totals.netAmount <= 0) {
        throw new BadRequestException(
          'O total líquido do pagamento deve ser maior que zero.',
        );
      }

      const accountPayable = await accountPayableRepository.save(
        accountPayableRepository.create({
          description: this.buildPayoutDescription(user.name, dates.periodStart, dates.periodEnd),
          category: 'Folha de Pagamento',
          amount: totals.netAmount,
          dueDate: this.toDateOnly(dates.periodEnd),
          beneficiaryUserId: user.id,
          originType: 'COMMISSION_PAYOUT',
          notes: payload.notes || null,
          status: 'PENDING',
        }),
      );

      const payout = await payoutRepository.save(
        payoutRepository.create({
          userId: user.id,
          accountPayableId: accountPayable.id,
          periodStart: this.toDateOnly(dates.periodStart),
          periodEnd: this.toDateOnly(dates.periodEnd),
          grossAmount: totals.grossAmount,
          adjustmentAmount: totals.adjustmentAmount,
          netAmount: totals.netAmount,
          status: 'OPEN',
          notes: payload.notes || null,
        }),
      );

      await payoutItemRepository.save(
        commissions.map((commission) =>
          payoutItemRepository.create({
            payoutId: payout.id,
            commissionId: commission.id,
            amount: this.normalizeMoney(commission.amount),
          }),
        ),
      );

      for (const commission of commissions) {
        commission.status = 'SCHEDULED';
        commission.notes = payload.notes || commission.notes || null;
      }
      await commissionRepository.save(commissions);

      return this.findPayoutById(payout.id, manager);
    });
  }

  async payPayout(id: number, dto: PayAccountDto) {
    return this.dataSource.transaction(async (manager) => {
      const payoutRepository = manager.getRepository(CommissionPayout);
      const accountPayableRepository = manager.getRepository(AccountPayable);

      const payout = await payoutRepository.findOne({
        where: { id },
        relations: ['accountPayable'],
      });
      if (!payout || !payout.accountPayableId) {
        throw new NotFoundException('Pagamento de comissão não encontrado.');
      }

      const accountPayable = await accountPayableRepository.findOneBy({
        id: payout.accountPayableId,
      });
      if (!accountPayable) {
        throw new NotFoundException('Conta a pagar vinculada não encontrada.');
      }

      const paymentData = await this.resolvePaymentMethod(manager, dto);
      accountPayable.status = 'PAID';
      accountPayable.paidAt = dto.paidAt;
      accountPayable.paidAmount = this.normalizeMoney(dto.paidAmount);
      accountPayable.paymentMethodId = paymentData.paymentMethodId;
      accountPayable.paymentMethod = paymentData.paymentMethod;
      await accountPayableRepository.save(accountPayable);

      await this.markPayoutAsPaidByAccountPayable(
        payout.accountPayableId,
        dto.paidAt,
        manager,
      );

      return this.findPayoutById(payout.id, manager);
    });
  }

  async undoPayoutPayment(id: number) {
    return this.dataSource.transaction(async (manager) => {
      const payoutRepository = manager.getRepository(CommissionPayout);
      const accountPayableRepository = manager.getRepository(AccountPayable);

      const payout = await payoutRepository.findOne({
        where: { id },
        relations: ['accountPayable'],
      });
      if (!payout || !payout.accountPayableId) {
        throw new NotFoundException('Pagamento de comissão não encontrado.');
      }

      const accountPayable = await accountPayableRepository.findOneBy({
        id: payout.accountPayableId,
      });
      if (!accountPayable) {
        throw new NotFoundException('Conta a pagar vinculada não encontrada.');
      }

      accountPayable.status = 'PENDING';
      accountPayable.paidAt = null;
      accountPayable.paidAmount = null;
      accountPayable.paymentMethodId = null;
      accountPayable.paymentMethod = null;
      await accountPayableRepository.save(accountPayable);

      await this.reopenPayoutByAccountPayable(payout.accountPayableId, manager);

      return this.findPayoutById(payout.id, manager);
    });
  }

  async markPayoutAsPaidByAccountPayable(
    accountPayableId: number,
    paidAt: Date,
    manager?: EntityManager,
  ) {
    const entityManager = manager || this.dataSource.manager;
    const payoutRepository = entityManager.getRepository(CommissionPayout);
    const commissionRepository = entityManager.getRepository(Commission);

    const payout = await payoutRepository.findOne({
      where: { accountPayableId },
      relations: ['items', 'items.commission'],
    });

    if (!payout || payout.status === 'PAID') {
      return payout;
    }

    payout.status = 'PAID';
    payout.paidAt = paidAt;
    await payoutRepository.save(payout);

    const commissionsToUpdate = (payout.items || [])
      .map((item) => item.commission)
      .filter(
        (commission): commission is Commission =>
          Boolean(commission) && commission.status === 'SCHEDULED',
      )
      .map((commission) => {
        commission.status = 'PAID';
        commission.paidAt = paidAt;
        return commission;
      });

    if (commissionsToUpdate.length) {
      await commissionRepository.save(commissionsToUpdate);
    }

    return payout;
  }

  async reopenPayoutByAccountPayable(
    accountPayableId: number,
    manager?: EntityManager,
  ) {
    const entityManager = manager || this.dataSource.manager;
    const payoutRepository = entityManager.getRepository(CommissionPayout);
    const commissionRepository = entityManager.getRepository(Commission);

    const payout = await payoutRepository.findOne({
      where: { accountPayableId },
      relations: ['items', 'items.commission'],
    });

    if (!payout || payout.status !== 'PAID') {
      return payout;
    }

    payout.status = 'OPEN';
    payout.paidAt = null;
    await payoutRepository.save(payout);

    const commissionsToUpdate = (payout.items || [])
      .map((item) => item.commission)
      .filter(
        (commission): commission is Commission =>
          Boolean(commission) && commission.status === 'PAID',
      )
      .map((commission) => {
        commission.status = 'SCHEDULED';
        commission.paidAt = null;
        return commission;
      });

    if (commissionsToUpdate.length) {
      await commissionRepository.save(commissionsToUpdate);
    }

    return payout;
  }

  async handleSaleCheckoutReversal(
    manager: EntityManager,
    sale: Sale,
    eventAt: Date,
    reason: string,
  ) {
    const commissionRepository = manager.getRepository(Commission);
    const payoutItemRepository = manager.getRepository(CommissionPayoutItem);

    const saleCommissions = await commissionRepository.find({
      where: {
        saleId: sale.id,
        reversalOfCommissionId: IsNull(),
      },
    });

    if (!saleCommissions.length) {
      return [];
    }

    const affectedOpenPayoutIds = new Set<number>();
    const changedCommissions: Commission[] = [];
    const reversalCandidates: Commission[] = [];

    for (const commission of saleCommissions) {
      if (commission.status === 'PAID') {
        const existingReversal = await commissionRepository.findOne({
          where: {
            reversalOfCommissionId: commission.id,
            status: 'PENDING',
          },
        });

        if (!existingReversal) {
          reversalCandidates.push(
            commissionRepository.create({
              userId: commission.userId,
              saleId: commission.saleId,
              consultationId: commission.consultationId,
              appointmentId: commission.appointmentId,
              procedureId: commission.procedureId,
              amount: this.normalizeMoney(Number(commission.amount) * -1),
              originType: 'SALE_REVERSAL',
              originReferenceId: sale.id,
              baseAmount: commission.baseAmount
                ? this.normalizeMoney(Number(commission.baseAmount) * -1)
                : null,
              ratePercent: commission.ratePercent,
              calculatedAt: eventAt,
              status: 'PENDING',
              notes: reason,
              reversalOfCommissionId: commission.id,
            }),
          );
        }
        continue;
      }

      if (commission.status === 'SCHEDULED') {
        const payoutItems = await payoutItemRepository.find({
          where: { commissionId: commission.id },
        });
        if (payoutItems.length) {
          payoutItems.forEach((item) => affectedOpenPayoutIds.add(item.payoutId));
          await payoutItemRepository.remove(payoutItems);
        }
      }

      commission.status = 'CANCELED';
      commission.canceledAt = eventAt;
      commission.notes = reason;
      changedCommissions.push(commission);
    }

    if (changedCommissions.length) {
      await commissionRepository.save(changedCommissions);
    }

    if (reversalCandidates.length) {
      await commissionRepository.save(reversalCandidates);
    }

    if (affectedOpenPayoutIds.size) {
      await this.recalculatePayoutsById(
        manager,
        Array.from(affectedOpenPayoutIds.values()),
      );
    }

    return [...changedCommissions, ...reversalCandidates];
  }

  async calculateForPaidSale(
    manager: EntityManager,
    sale: Sale,
    calculatedAt: Date,
  ): Promise<Commission[]> {
    const saleItemsRepository = manager.getRepository(SaleItem);
    const commissionsRepository = manager.getRepository(Commission);

    const saleItems = await saleItemsRepository.find({
      where: { saleId: sale.id },
      relations: ['procedure'],
    });

    const groupedProcedureItems = saleItems.reduce<
      Map<number, { baseAmount: number; ratePercent: number }>
    >((acc, item) => {
      if (!item.procedureId || !item.procedure) {
        return acc;
      }

      const baseAmount = this.normalizeMoney(item.totalPrice);
      const ratePercent = this.normalizeMoney(item.procedure.commissionPercent);
      const current = acc.get(item.procedureId) || {
        baseAmount: 0,
        ratePercent,
      };

      current.baseAmount = this.normalizeMoney(current.baseAmount + baseAmount);
      current.ratePercent = ratePercent;
      acc.set(item.procedureId, current);
      return acc;
    }, new Map<number, { baseAmount: number; ratePercent: number }>());

    const created: Commission[] = [];

    for (const [procedureId, groupedItem] of groupedProcedureItems.entries()) {
      if (groupedItem.ratePercent <= 0) {
        continue;
      }

      const existing = await commissionsRepository.findOne({
        where: {
          saleId: sale.id,
          procedureId,
          reversalOfCommissionId: IsNull(),
        },
      });

      if (existing) {
        if (existing.status === 'CANCELED') {
          existing.status = 'PENDING';
          existing.paidAt = null;
          existing.canceledAt = null;
          existing.calculatedAt = calculatedAt;
          existing.baseAmount = groupedItem.baseAmount;
          existing.ratePercent = groupedItem.ratePercent;
          existing.amount = this.normalizeMoney(
            (groupedItem.baseAmount * groupedItem.ratePercent) / 100,
          );
          existing.notes = null;
          created.push(await commissionsRepository.save(existing));
          continue;
        }

        if (existing.status === 'PAID') {
          const reversal = await commissionsRepository.findOne({
            where: {
              reversalOfCommissionId: existing.id,
              status: 'PENDING',
            },
          });

          if (reversal) {
            reversal.status = 'CANCELED';
            reversal.canceledAt = calculatedAt;
            reversal.notes = 'Estorno cancelado pela reabertura do checkout da venda.';
            await commissionsRepository.save(reversal);
          }
        }

        continue;
      }

      const amount = this.normalizeMoney(
        (groupedItem.baseAmount * groupedItem.ratePercent) / 100,
      );

      const commission = commissionsRepository.create({
        userId: sale.veterinarianId,
        saleId: sale.id,
        consultationId: sale.consultationId ?? null,
        appointmentId: sale.appointmentId ?? null,
        procedureId,
        amount,
        originType: 'SALE',
        originReferenceId: sale.id,
        baseAmount: groupedItem.baseAmount,
        ratePercent: groupedItem.ratePercent,
        calculatedAt,
        status: 'PENDING',
      });

      created.push(await commissionsRepository.save(commission));
    }

    return created;
  }

  private async getEligibleCommissions(
    manager: EntityManager,
    userId: number,
    periodStart: Date,
    periodEnd: Date,
  ) {
    return manager.getRepository(Commission).find({
      where: {
        userId,
        status: 'PENDING',
      },
      relations: ['sale', 'procedure'],
      order: {
        calculatedAt: 'ASC',
        id: 'ASC',
      },
    }).then((commissions) =>
      commissions.filter((commission) => {
        const calculatedAt = new Date(commission.calculatedAt);
        return (
          calculatedAt.valueOf() >= periodStart.valueOf() &&
          calculatedAt.valueOf() <= periodEnd.valueOf()
        );
      }),
    );
  }

  private async recalculatePayoutsById(
    manager: EntityManager,
    payoutIds: number[],
  ) {
    if (!payoutIds.length) {
      return;
    }

    const payoutRepository = manager.getRepository(CommissionPayout);
    const accountPayableRepository = manager.getRepository(AccountPayable);

    const payouts = await payoutRepository.find({
      where: {
        id: In(payoutIds),
      },
      relations: ['items', 'items.commission', 'accountPayable'],
    });

    for (const payout of payouts) {
      if (payout.status !== 'OPEN') {
        continue;
      }

      const activeCommissions = (payout.items || [])
        .map((item) => item.commission)
        .filter(
          (commission): commission is Commission =>
            Boolean(commission) && commission.status === 'SCHEDULED',
        );

      const totals = this.computePayoutTotals(activeCommissions);

      payout.grossAmount = totals.grossAmount;
      payout.adjustmentAmount = totals.adjustmentAmount;
      payout.netAmount = totals.netAmount;

      if (payout.accountPayable) {
        payout.accountPayable.amount = totals.netAmount > 0 ? totals.netAmount : 0;
        if (!activeCommissions.length || totals.netAmount <= 0) {
          payout.accountPayable.status = 'CANCELED';
          payout.status = 'CANCELED';
        }
        await accountPayableRepository.save(payout.accountPayable);
      }

      await payoutRepository.save(payout);
    }
  }

  private async resolvePaymentMethod(
    manager: EntityManager,
    dto: PayAccountDto,
  ): Promise<{ paymentMethodId: number | null; paymentMethod: string | null }> {
    if (dto.paymentMethodId) {
      const paymentMethod = await manager.getRepository(PaymentMethod).findOne({
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

  private computePayoutTotals(commissions: Array<Pick<Commission, 'amount'>>) {
    return commissions.reduce<CommissionPayoutTotals>(
      (acc, commission) => {
        const amount = this.normalizeMoney(commission.amount);
        if (amount >= 0) {
          acc.grossAmount = this.normalizeMoney(acc.grossAmount + amount);
        } else {
          acc.adjustmentAmount = this.normalizeMoney(
            acc.adjustmentAmount + amount,
          );
        }
        acc.netAmount = this.normalizeMoney(acc.netAmount + amount);
        return acc;
      },
      {
        grossAmount: 0,
        adjustmentAmount: 0,
        netAmount: 0,
      },
    );
  }

  private resolvePeriod(payload: PreviewCommissionPayoutDto) {
    const periodStart = new Date(payload.periodStart);
    const periodEnd = new Date(payload.periodEnd);

    if (
      Number.isNaN(periodStart.getTime()) ||
      Number.isNaN(periodEnd.getTime()) ||
      periodEnd.valueOf() < periodStart.valueOf()
    ) {
      throw new BadRequestException('Período informado é inválido.');
    }

    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(23, 59, 59, 999);

    return { periodStart, periodEnd };
  }

  private buildPayoutDescription(
    userName: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const start = periodStart.toLocaleDateString('pt-BR');
    const end = periodEnd.toLocaleDateString('pt-BR');
    return `Pagamento de comissão - ${userName} (${start} a ${end})`;
  }

  private toDateOnly(date: Date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private normalizeMoney(value: number | string | null | undefined): number {
    const parsed = Number(value || 0);
    return Math.round((parsed + Number.EPSILON) * 100) / 100;
  }
}
