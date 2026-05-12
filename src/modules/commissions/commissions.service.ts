import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sale-items/entities/sale-item.entity';
import { Commission } from './entities/commission.entity';
import {
  CommissionsFilterOptions,
  CommissionsRepository,
} from './repositories/commissions.repository';

@Injectable()
export class CommissionsService {
  constructor(private readonly commissionsRepository: CommissionsRepository) {}

  async findAll(filters: CommissionsFilterOptions) {
    return this.commissionsRepository.findPaginated(filters);
  }

  async getSummary(filters: Omit<CommissionsFilterOptions, 'page' | 'limit'>) {
    return this.commissionsRepository.summarize(filters);
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

      const exists = await commissionsRepository.findOne({
        where: {
          saleId: sale.id,
          procedureId,
        },
      });

      if (exists) {
        continue;
      }

      const amount = this.normalizeMoney(
        (groupedItem.baseAmount * groupedItem.ratePercent) / 100,
      );

      const commission = commissionsRepository.create({
        userId: sale.veterinarianId,
        saleId: sale.id,
        procedureId,
        amount,
        baseAmount: groupedItem.baseAmount,
        ratePercent: groupedItem.ratePercent,
        calculatedAt,
        status: 'PENDING',
      });

      created.push(await commissionsRepository.save(commission));
    }

    return created;
  }

  private normalizeMoney(value: number | string | null | undefined): number {
    const parsed = Number(value || 0);
    return Math.round((parsed + Number.EPSILON) * 100) / 100;
  }
}
