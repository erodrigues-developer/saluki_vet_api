import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductCategoriesRepository } from './repositories/product-categories.repository';
import { ProductCategory } from './entities/product-category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class ProductCategoriesService {
  constructor(
    private readonly productCategoriesRepository: ProductCategoriesRepository,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(payload: any): Promise<ProductCategory> {
    await this.ensureUniqueCategoryName(payload?.name);
    const category = this.productCategoriesRepository.create({
      isActive: payload?.isActive ?? true,
      ...payload,
    } as any);
    return this.productCategoriesRepository.save(category as any);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean | string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;
    const sortBy = params.sortBy || 'name';
    const sortDirection =
      params.sortDirection?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const isActive =
      params.isActive === true ||
      params.isActive === 'true' ||
      params.isActive === false ||
      params.isActive === 'false'
        ? params.isActive === true || params.isActive === 'true'
        : undefined;

    const [data, total] = await this.productCategoriesRepository.findPaginated({
      page,
      limit,
      search: params.search,
      isActive,
      sortBy,
      sortDirection,
    });
    const summary = await this.productCategoriesRepository.getSummary(
      params.search,
    );

    return {
      data,
      meta: {
        page,
        limit,
        total,
        summary,
      },
    };
  }

  async findOne(id: number): Promise<ProductCategory> {
    const category = await this.productCategoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`ProductCategory ${id} not found`);
    }
    return category;
  }

  async update(id: number, payload: any): Promise<ProductCategory> {
    const category = await this.findOne(id);
    if (payload?.name !== undefined) {
      await this.ensureUniqueCategoryName(payload?.name, id);
    }
    const merged = this.productCategoriesRepository.merge(category, payload);
    return this.productCategoriesRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    const linkedProducts = await this.productsRepository.count({
      where: { productCategoryId: category.id, deletedAt: null },
    });
    if (linkedProducts > 0) {
      throw new ConflictException(
        'Não é possível excluir categorias com produtos vinculados.',
      );
    }
    await this.productCategoriesRepository.remove(category);
  }

  private async ensureUniqueCategoryName(
    rawName?: string,
    ignoreId?: number,
  ): Promise<void> {
    const name = String(rawName || '').trim();
    if (!name) return;

    const qb = this.productCategoriesRepository
      .createQueryBuilder('category')
      .where('LOWER(TRIM(category.name)) = LOWER(TRIM(:name))', { name });

    if (ignoreId) {
      qb.andWhere('category.id != :ignoreId', { ignoreId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException('Já existe uma categoria com esse nome.');
    }
  }
}
