import { Module } from '@nestjs/common';
import { ClinicSettingsModule } from '../clinic-settings/clinic-settings.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { PetVaccinesModule } from '../pet-vaccines/pet-vaccines.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ClinicSettingsModule, StockMovementsModule, PetVaccinesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
