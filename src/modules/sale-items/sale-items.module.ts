import { Module } from '@nestjs/common';
import { SaleItemsController } from './sale-items.controller';
import { SaleItemsService } from './sale-items.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleItem } from './entities/sale-item.entity';
import { SaleItemsRepository } from './repositories/sale-items.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SaleItem])],
  controllers: [SaleItemsController],
  providers: [SaleItemsService, SaleItemsRepository],
  exports: [SaleItemsService],
})
export class SaleItemsModule {}
