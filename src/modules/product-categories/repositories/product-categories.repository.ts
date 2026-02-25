import { Injectable } from '@nestjs/common';
import { DataSource, Repository, FindOptionsWhere, ILike } from 'typeorm';
import { ProductCategory } from '../entities/product-category.entity';

@Injectable()
export class ProductCategoriesRepository extends Repository<ProductCategory> {
  constructor(private readonly dataSource: DataSource) {
    super(ProductCategory, dataSource.createEntityManager());
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    name?: string;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
  }): Promise<[ProductCategory[], number]> {
    const { page, limit, name, sortBy, sortDirection } = params;

    const where: FindOptionsWhere<ProductCategory> = {};
    if (name) {
      where.name = ILike(`%${name}%`);
    }

    return this.findAndCount({
      where,
      order: {
        [sortBy]: sortDirection,
        id: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
