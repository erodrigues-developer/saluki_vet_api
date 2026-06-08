import { Product } from './entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './repositories/products.repository';
import { ProductCategoriesModule } from '../product-categories/product-categories.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    ProductCategoriesModule,
    StockMovementsModule,
    S3Module,
    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}
