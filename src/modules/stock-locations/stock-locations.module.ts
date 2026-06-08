import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockLocation } from './entities/stock-location.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';
import { StockLocationsController } from './stock-locations.controller';
import { StockLocationsService } from './stock-locations.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockLocation, StockMovement])],
  controllers: [StockLocationsController],
  providers: [StockLocationsService],
  exports: [StockLocationsService],
})
export class StockLocationsModule {}
