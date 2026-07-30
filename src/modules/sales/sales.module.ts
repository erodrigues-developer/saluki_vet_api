import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SalesRepository } from './repositories/sales.repository';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { AccountReceivable } from '../accounts-receivable/entities/account-receivable.entity';
import { CommissionsModule } from '../commissions/commissions.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { CashRegistersModule } from '../cash-registers/cash-registers.module';

@Module({
  imports: [
    CommissionsModule,
    StockMovementsModule,
    CashRegistersModule,
    TypeOrmModule.forFeature([Sale, Payment, PaymentMethod, AccountReceivable]),
  ],
  controllers: [SalesController],
  providers: [SalesService, SalesRepository],
  exports: [SalesService],
})
export class SalesModule {}
