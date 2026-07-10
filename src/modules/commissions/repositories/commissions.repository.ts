import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Commission } from '../entities/commission.entity';

export interface CommissionsFilterOptions {
  page: number;
  limit: number;
  status?: string;
  userId?: number;
  saleId?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class CommissionsRepository extends Repository<Commission> {
  constructor(private readonly dataSource: DataSource) {
    super(Commission, dataSource.createEntityManager());
  }

  async findPaginated(filters: CommissionsFilterOptions) {
    const query = this.applyFilters(this.createBaseQuery(), filters);

    query
      .orderBy('commission.calculatedAt', 'DESC')
      .addOrderBy('commission.id', 'DESC')
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit);

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

  async summarize(filters: Omit<CommissionsFilterOptions, 'page' | 'limit'>) {
    const data = await this.applyFilters(this.createBaseQuery(), {
      page: 1,
      limit: 1,
      ...filters,
    }).getMany();

    const countByStatus = data.reduce<Record<string, number>>(
      (acc, commission) => {
        acc[commission.status] = (acc[commission.status] || 0) + 1;
        return acc;
      },
      {},
    );

    return data.reduce(
      (acc, commission) => {
        const amount = Number(commission.amount || 0);
        if (commission.status === 'PAID') {
          acc.paidTotal += amount;
        } else if (commission.status === 'SCHEDULED') {
          acc.scheduledTotal += amount;
        } else if (commission.status === 'CANCELED') {
          acc.canceledTotal += amount;
        } else {
          acc.pendingTotal += amount;
        }
        return acc;
      },
      {
        pendingTotal: 0,
        scheduledTotal: 0,
        paidTotal: 0,
        canceledTotal: 0,
        countByStatus,
      },
    );
  }

  private createBaseQuery(): SelectQueryBuilder<Commission> {
    return this.createQueryBuilder('commission')
      .leftJoinAndSelect('commission.user', 'user')
      .leftJoinAndSelect('commission.sale', 'sale')
      .leftJoinAndSelect('commission.procedure', 'procedure')
      .leftJoinAndSelect('commission.payoutItems', 'payoutItem')
      .leftJoinAndSelect('payoutItem.payout', 'payout')
      .leftJoinAndSelect('payout.accountPayable', 'accountPayable');
  }

  private applyFilters(
    query: SelectQueryBuilder<Commission>,
    filters: CommissionsFilterOptions,
  ) {
    if (filters.status) {
      query.andWhere('commission.status = :status', { status: filters.status });
    }

    if (filters.userId) {
      query.andWhere('commission.userId = :userId', { userId: filters.userId });
    }

    if (filters.saleId) {
      query.andWhere('commission.saleId = :saleId', { saleId: filters.saleId });
    }

    if (filters.startDate) {
      query.andWhere('commission.calculatedAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere('commission.calculatedAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return query;
  }
}
