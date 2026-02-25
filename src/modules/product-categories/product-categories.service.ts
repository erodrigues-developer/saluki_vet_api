import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductCategoriesRepository } from './repositories/product-categories.repository';
import { ProductCategory } from './entities/product-category.entity';

@Injectable()
export class ProductCategoriesService {
  constructor(
    private readonly productCategoriesRepository: ProductCategoriesRepository,
  ) {}

  async create(payload: any): Promise<ProductCategory> {
    const category = this.productCategoriesRepository.create({ ...payload } as any);
    return this.productCategoriesRepository.save(category as any);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    name?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;
    const sortBy = params.sortBy || 'name';
    const sortDirection = params.sortDirection?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const [data, total] = await this.productCategoriesRepository.findPaginated({
      page,
      limit,
      name: params.name,
      sortBy,
      sortDirection,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(id: number): Promise<ProductCategory> {
    const category = await this.productCategoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`ProductCategory ${id} not found`);
    }
    return category;
  }

  async update(id: number, payload: any): Promise<ProductCategory> {
    const category = await this.findOne(id);
    const merged = this.productCategoriesRepository.merge(category, payload);
    return this.productCategoriesRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.productCategoriesRepository.remove(category);
  }
}
