import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportGeneration } from './entities/report-generation.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { AccountReceivable } from '../accounts-receivable/entities/account-receivable.entity';
import { AccountPayable } from '../accounts-payable/entities/account-payable.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';
import { StockLocation } from '../stock-locations/entities/stock-location.entity';
import { StockBatch } from '../stock-batches/entities/stock-batch.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { AppointmentStatus } from '../appointment-statuses/entities/appointment-status.entity';
import { AppointmentType } from '../appointment-types/entities/appointment-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportGeneration,
      AccountReceivable,
      AccountPayable,
      Sale,
      Consultation,
      Appointment,
      StockMovement,
      Product,
      StockLocation,
      StockBatch,
      Client,
      User,
      Supplier,
      AppointmentStatus,
      AppointmentType,
    ]),
    FileStorageModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
