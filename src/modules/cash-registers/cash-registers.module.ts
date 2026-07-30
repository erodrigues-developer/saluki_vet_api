import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicSettings } from '../clinic-settings/entities/clinic-settings.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { Sale } from '../sales/entities/sale.entity';
import { CashRegistersController } from './cash-registers.controller';
import { CashRegistersService } from './cash-registers.service';
import { CashRegisterMovement } from './entities/cash-register-movement.entity';
import { CashRegisterSession } from './entities/cash-register-session.entity';
import { CashRegisterTerminal } from './entities/cash-register-terminal.entity';
import { PrintJob } from './entities/print-job.entity';
import { ThermalPrinter } from './entities/thermal-printer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CashRegisterTerminal,
      CashRegisterSession,
      CashRegisterMovement,
      ThermalPrinter,
      PrintJob,
      Sale,
      Payment,
      PaymentMethod,
      ClinicSettings,
    ]),
  ],
  controllers: [CashRegistersController],
  providers: [CashRegistersService],
  exports: [CashRegistersService],
})
export class CashRegistersModule {}
