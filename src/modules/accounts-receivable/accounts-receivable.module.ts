import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountReceivable } from './entities/account-receivable.entity';
import { AccountsReceivableController } from './accounts-receivable.controller';
import { AccountsReceivableService } from './accounts-receivable.service';
import { Client } from '../clients/entities/client.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountReceivable, Client, PaymentMethod])],
  controllers: [AccountsReceivableController],
  providers: [AccountsReceivableService],
  exports: [AccountsReceivableService],
})
export class AccountsReceivableModule {}
