import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './repositories/products.repository';
import { Product } from './entities/product.entity';
import { ProductCategoriesService } from '../product-categories/product-categories.service';
import { DataSource } from 'typeorm';
import { StockMovementsService } from '../stock-movements/stock-movements.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly productCategoriesService: ProductCategoriesService,
    private readonly dataSource: DataSource,
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  async create(payload: any): Promise<Product> {
    await this.ensureSkuIsUnique(payload.sku);
    if (payload.productCategoryId) {
      await this.productCategoriesService.findOne(payload.productCategoryId);
    }
    const product = this.productsRepository.create({ ...payload } as any);
    return this.productsRepository.save(product as any);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    name?: string;
    sku?: string;
    productCategoryId?: number;
    isService?: boolean | string;
    isActive?: boolean | string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;
    const sortBy = params.sortBy || 'name';
    const sortDirection =
      params.sortDirection?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let parsedIsActive: boolean | undefined = undefined;
    if (params.isActive !== undefined && params.isActive !== null) {
      parsedIsActive = params.isActive === 'true' || params.isActive === true;
    }

    let parsedIsService: boolean | undefined = undefined;
    if (params.isService !== undefined && params.isService !== null) {
      parsedIsService =
        params.isService === 'true' || params.isService === true;
    }

    const [data, total] = await this.productsRepository.findPaginated({
      page,
      limit,
      name: params.name,
      sku: params.sku,
      productCategoryId: params.productCategoryId
        ? Number(params.productCategoryId)
        : undefined,
      isService: parsedIsService,
      isActive: parsedIsActive,
      sortBy,
      sortDirection,
    });

    return {
      data: await this.attachCurrentStock(data),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['productCategory'],
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    const [withStock] = await this.attachCurrentStock([product]);
    return withStock;
  }

  async update(id: number, payload: any): Promise<Product> {
    const product = await this.findOne(id);
    await this.ensureSkuIsUnique(payload.sku, id);

    if (
      payload.productCategoryId &&
      payload.productCategoryId !== product.productCategoryId
    ) {
      await this.productCategoriesService.findOne(payload.productCategoryId);
    }

    const merged = this.productsRepository.merge(product, payload);
    return this.productsRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.ensureNoLinkedMovements(product.id);
    // Soft delete
    await this.productsRepository.softRemove(product);
  }

  private normalizeSku(value: unknown) {
    const sku = String(value ?? '').trim();
    return sku.length ? sku : null;
  }

  private async ensureSkuIsUnique(skuValue: unknown, ignoreProductId?: number) {
    const normalizedSku = this.normalizeSku(skuValue);
    if (!normalizedSku) return;

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .where('LOWER(product.sku) = LOWER(:sku)', { sku: normalizedSku });

    if (ignoreProductId) {
      qb.andWhere('product.id != :id', { id: ignoreProductId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException('SKU já cadastrado.');
    }
  }

  private async ensureNoLinkedMovements(productId: number) {
    const [saleItems, stockMovements, treatmentMap, procedures] =
      await Promise.all([
        this.dataSource.manager
          .createQueryBuilder()
          .from('sale_items', 'sale_items')
          .where('sale_items.product_id = :productId', { productId })
          .getCount(),
        this.dataSource.manager
          .createQueryBuilder()
          .from('stock_movements', 'stock_movements')
          .where('stock_movements.product_id = :productId', { productId })
          .getCount(),
        this.dataSource.manager
          .createQueryBuilder()
          .from('treatment_map', 'treatment_map')
          .where('treatment_map.medicament_id = :productId', { productId })
          .getCount(),
        this.dataSource.manager
          .createQueryBuilder()
          .from('procedures', 'procedures')
          .where('procedures.consumed_product_id = :productId', { productId })
          .getCount(),
      ]);

    if (saleItems || stockMovements || treatmentMap || procedures) {
      throw new ConflictException(
        'Não é possível excluir itens com movimentações vinculadas. Você pode inativá-lo para impedir novos lançamentos.',
      );
    }
  }

  private async attachCurrentStock(products: Product[]) {
    return Promise.all(
      products.map(async (product) => ({
        ...product,
        currentStock: product.trackStock
          ? await this.stockMovementsService.getCurrentStock(
              this.dataSource.manager,
              product.id,
            )
          : null,
      })),
    );
  }
}
