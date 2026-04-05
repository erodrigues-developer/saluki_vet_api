import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountReceivable } from './entities/account-receivable.entity';
import { AccountsReceivableController } from './accounts-receivable.controller';
import { AccountsReceivableService } from './accounts-receivable.service';
import { AccountsReceivableRepository } from './repositories/accounts-receivable.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AccountReceivable])],
  controllers: [AccountsReceivableController],
  providers: [AccountsReceivableService, AccountsReceivableRepository],
  exports: [AccountsReceivableService, AccountsReceivableRepository],
})
export class AccountsReceivableModule {}
