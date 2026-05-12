import { ProductCategory } from './entities/product-category.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ProductCategoriesService } from './product-categories.service';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesRepository } from './repositories/product-categories.repository';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCategory, Product])],
  controllers: [ProductCategoriesController],
  providers: [ProductCategoriesService, ProductCategoriesRepository],
  exports: [ProductCategoriesService],
})
export class ProductCategoriesModule {}
