import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { AccountReceivable } from '../entities/account-receivable.entity';

export interface AccountsReceivableFilterOptions {
  page: number;
  limit: number;
  status?: string;
  clientId?: number;
  saleId?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AccountsReceivableRepository extends Repository<AccountReceivable> {
  constructor(private readonly dataSource: DataSource) {
    super(AccountReceivable, dataSource.createEntityManager());
  }

  async findPaginated(filters: AccountsReceivableFilterOptions) {
    const query = this.createBaseQuery();

    if (filters.status) {
      query.andWhere('account.status = :status', { status: filters.status });
    }

    if (filters.clientId) {
      query.andWhere('account.clientId = :clientId', {
        clientId: filters.clientId,
      });
    }

    if (filters.saleId) {
      query.andWhere('account.saleId = :saleId', { saleId: filters.saleId });
    }

    if (filters.startDate) {
      query.andWhere('account.dueDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere('account.dueDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    query
      .orderBy('account.dueDate', 'DESC')
      .addOrderBy('account.id', 'DESC')
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

  private createBaseQuery(): SelectQueryBuilder<AccountReceivable> {
    return this.createQueryBuilder('account')
      .leftJoinAndSelect('account.client', 'client')
      .leftJoinAndSelect('account.sale', 'sale');
  }
}
