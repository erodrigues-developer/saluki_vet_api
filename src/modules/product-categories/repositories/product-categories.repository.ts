import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductCategory } from '../entities/product-category.entity';

@Injectable()
export class ProductCategoriesRepository extends Repository<ProductCategory> {
  constructor(private readonly dataSource: DataSource) {
    super(ProductCategory, dataSource.createEntityManager());
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
  }): Promise<[ProductCategory[], number]> {
    const { page, limit, search, isActive, sortBy, sortDirection } = params;
    const qb = this.createQueryBuilder('category');

    if (search?.trim()) {
      qb.andWhere(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (typeof isActive === 'boolean') {
      qb.andWhere('category.isActive = :isActive', { isActive });
    }

    qb.loadRelationCountAndMap(
      'category.productsLinked',
      'category.products',
      'product',
      (subQuery) => subQuery.andWhere('product.deletedAt IS NULL'),
    );

    const allowedSortBy = new Set([
      'name',
      'updatedAt',
      'createdAt',
      'isActive',
    ]);
    const normalizedSortBy = allowedSortBy.has(sortBy) ? sortBy : 'name';

    qb.orderBy(`category.${normalizedSortBy}`, sortDirection).addOrderBy(
      'category.id',
      'DESC',
    );
    qb.skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async getSummary(search?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    productsLinked: number;
  }> {
    const qb = this.createQueryBuilder('category');

    if (search?.trim()) {
      qb.andWhere(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    qb.select('COUNT(category.id)', 'total')
      .addSelect(
        'SUM(CASE WHEN category.is_active = true THEN 1 ELSE 0 END)',
        'active',
      )
      .addSelect(
        'SUM(CASE WHEN category.is_active = false THEN 1 ELSE 0 END)',
        'inactive',
      )
      .addSelect(
        `COALESCE(SUM((SELECT COUNT(1) FROM products p WHERE p.product_category_id = category.id AND p.deleted_at IS NULL)), 0)`,
        'productsLinked',
      );

    const row = await qb.getRawOne<{
      total: string | null;
      active: string | null;
      inactive: string | null;
      productsLinked: string | null;
    }>();

    return {
      total: Number(row?.total || 0),
      active: Number(row?.active || 0),
      inactive: Number(row?.inactive || 0),
      productsLinked: Number(row?.productsLinked || 0),
    };
  }
}
