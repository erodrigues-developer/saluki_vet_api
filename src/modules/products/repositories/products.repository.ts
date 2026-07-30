import { Injectable } from '@nestjs/common';
import { DataSource, Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsRepository extends Repository<Product> {
  constructor(private readonly dataSource: DataSource) {
    super(Product, dataSource.createEntityManager());
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    name?: string;
    sku?: string;
    barcode?: string;
    productCategoryId?: number;
    isService?: boolean;
    isActive?: boolean;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
  }): Promise<[Product[], number]> {
    const {
      page,
      limit,
      name,
      sku,
      barcode,
      productCategoryId,
      isService,
      isActive,
      sortBy,
      sortDirection,
    } = params;

    const where: FindOptionsWhere<Product> = {};
    if (name) {
      where.name = ILike(`%${name}%`);
    }
    if (sku) {
      where.sku = ILike(`%${sku}%`);
    }
    if (barcode) {
      where.barcode = ILike(`%${barcode}%`);
    }
    if (productCategoryId) {
      where.productCategoryId = productCategoryId;
    }
    if (isService !== undefined && isService !== null) {
      where.isService = Boolean(isService); // Handle false values properly if coming as string from query
    }
    if (isActive !== undefined && isActive !== null) {
      where.isActive = Boolean(isActive);
    }

    return this.findAndCount({
      where,
      relations: ['productCategory'],
      order: {
        [sortBy]: sortDirection,
        id: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
