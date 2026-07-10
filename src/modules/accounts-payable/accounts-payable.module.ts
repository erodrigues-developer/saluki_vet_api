import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsPayableService } from './accounts-payable.service';
import { AccountsPayableController } from './accounts-payable.controller';
import { AccountPayable } from './entities/account-payable.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { User } from '../users/entities/user.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { CommissionsModule } from '../commissions/commissions.module';

@Module({
  imports: [
    CommissionsModule,
    TypeOrmModule.forFeature([AccountPayable, Supplier, User, PaymentMethod]),
  ],
  controllers: [AccountsPayableController],
  providers: [AccountsPayableService],
})
export class AccountsPayableModule {}
