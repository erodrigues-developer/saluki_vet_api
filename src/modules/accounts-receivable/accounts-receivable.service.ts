import { Injectable } from '@nestjs/common';
import {
  AccountsReceivableFilterOptions,
  AccountsReceivableRepository,
} from './repositories/accounts-receivable.repository';

@Injectable()
export class AccountsReceivableService {
  constructor(
    private readonly accountsReceivableRepository: AccountsReceivableRepository,
  ) {}

  async findAll(filters: AccountsReceivableFilterOptions) {
    return this.accountsReceivableRepository.findPaginated(filters);
  }
}
