import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductsRepository } from './repositories/products.repository';
import { Product } from './entities/product.entity';
import { ProductCategoriesService } from '../product-categories/product-categories.service';
import { DataSource } from 'typeorm';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { S3Service } from '../s3/services/s3.service';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly productCategoriesService: ProductCategoriesService,
    private readonly dataSource: DataSource,
    private readonly stockMovementsService: StockMovementsService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  async create(payload: any): Promise<Product> {
    this.normalizeDuration(payload);
    this.normalizeInventoryFields(payload);
    await this.ensureSkuIsUnique(payload.sku);
    await this.ensureBarcodeIsUnique(payload.barcode);
    if (payload.productCategoryId) {
      await this.productCategoriesService.findOne(payload.productCategoryId);
    }

    const createdId = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Product);
      const product = repository.create({ ...payload } as any);
      const saved = await repository.save(product as any);
      return saved.id;
    });

    return this.findOne(createdId);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    name?: string;
    sku?: string;
    barcode?: string;
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
      barcode: params.barcode,
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
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['productCategory'],
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    this.normalizeDuration(payload, product);
    this.normalizeInventoryFields(payload, product);
    await this.ensureSkuIsUnique(payload.sku, id);
    await this.ensureBarcodeIsUnique(payload.barcode, id);

    if (
      payload.productCategoryId &&
      payload.productCategoryId !== product.productCategoryId
    ) {
      await this.productCategoriesService.findOne(payload.productCategoryId);
    }

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Product);
      const merged = repository.merge(product, payload);
      await repository.save(merged);
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.ensureNoLinkedMovements(product.id);
    // Soft delete
    await this.productsRepository.softRemove(product);
  }

  async uploadImage(
    file: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
    requestBaseUrl: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo de imagem recebido sem conteudo.');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Envie apenas arquivos de imagem.');
    }

    if (Number(file.size || 0) > 5 * 1024 * 1024) {
      throw new BadRequestException(
        'A imagem deve ter no maximo 5 MB para upload.',
      );
    }

    const extension = this.resolveFileExtension(
      file.originalname,
      file.mimetype,
    );
    const fileName = `${randomUUID()}${extension}`;
    const key = `products/${fileName}`;

    if (this.isProductionUpload()) {
      const uploaded = await this.s3Service.uploadBinaryFile({
        buffer: file.buffer,
        key,
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000, immutable',
      });

      return {
        imgUrl: uploaded.url,
      };
    }

    const uploadsDir = join(process.cwd(), 'uploads', 'products');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, fileName), file.buffer);

    return {
      imgUrl: `${requestBaseUrl.replace(/\/+$/, '')}/uploads/products/${fileName}`,
    };
  }

  private normalizeSku(value: unknown) {
    const sku = String(value ?? '').trim();
    return sku.length ? sku : null;
  }

  private normalizeBarcode(value: unknown) {
    const barcode = String(value ?? '').trim();
    return barcode.length ? barcode : null;
  }

  private normalizeImgUrl(value: unknown) {
    const imgUrl = String(value ?? '').trim();
    return imgUrl.length ? imgUrl : null;
  }

  private normalizeText(value: unknown) {
    const text = String(value ?? '').trim();
    return text.length ? text : null;
  }

  private normalizeDuration(payload: any, current?: Product) {
    const nextIsService =
      payload?.isService !== undefined
        ? Boolean(payload.isService)
        : current?.isService;

    if (!nextIsService) {
      payload.durationMinutes = null;
      return;
    }

    const rawDuration =
      payload?.durationMinutes !== undefined
        ? payload.durationMinutes
        : current?.durationMinutes;
    const parsedDuration = Number(rawDuration);

    if (
      !Number.isFinite(parsedDuration) ||
      !Number.isInteger(parsedDuration) ||
      parsedDuration <= 0
    ) {
      throw new BadRequestException(
        'Duração é obrigatória para serviços e deve ser um número inteiro maior que zero.',
      );
    }

    payload.durationMinutes = parsedDuration;
  }

  private normalizeInventoryFields(payload: any, current?: Product) {
    const nextIsService =
      payload?.isService !== undefined
        ? Boolean(payload.isService)
        : current?.isService;

    payload.sku = this.normalizeSku(payload?.sku ?? current?.sku);
    payload.barcode = this.normalizeBarcode(
      payload?.barcode ?? current?.barcode,
    );
    payload.imgUrl = this.normalizeImgUrl(payload?.imgUrl ?? current?.imgUrl);

    if (payload?.productCategoryId === '') {
      payload.productCategoryId = null;
    }

    if (nextIsService) {
      payload.trackStock = false;
      payload.tracksExpiration = false;
      payload.unit = null;
      payload.saleMode = 'UNIT';
      payload.saleUnit = null;
      payload.scaleBarcodeEnabled = false;
      payload.scaleBarcodePrefix = null;
      payload.scaleBarcodeProductCode = null;
      payload.scaleBarcodeType = null;
      payload.minimumStock = null;
      payload.barcode = null;
      return;
    }

    payload.trackStock = true;
    payload.tracksExpiration = current?.tracksExpiration ?? false;

    const rawSaleMode = String(payload?.saleMode ?? current?.saleMode ?? 'UNIT')
      .trim()
      .toUpperCase();
    payload.saleMode = rawSaleMode === 'WEIGHT' ? 'WEIGHT' : 'UNIT';

    if (payload.saleMode === 'WEIGHT') {
      payload.unit = 'kg';
      payload.saleUnit = 'kg';
    } else {
      payload.unit =
        String(payload?.unit ?? current?.unit ?? 'un').trim() || 'un';
      payload.saleUnit =
        String(payload?.saleUnit ?? current?.saleUnit ?? payload.unit ?? 'un')
          .trim()
          .toLowerCase() || 'un';
    }

    payload.scaleBarcodeEnabled = Boolean(
      payload?.scaleBarcodeEnabled ?? current?.scaleBarcodeEnabled ?? false,
    );
    payload.scaleBarcodePrefix = this.normalizeText(
      payload?.scaleBarcodePrefix ?? current?.scaleBarcodePrefix,
    );
    payload.scaleBarcodeProductCode = this.normalizeText(
      payload?.scaleBarcodeProductCode ?? current?.scaleBarcodeProductCode,
    );
    const scaleBarcodeType = String(
      payload?.scaleBarcodeType ?? current?.scaleBarcodeType ?? 'WEIGHT',
    )
      .trim()
      .toUpperCase();
    payload.scaleBarcodeType =
      payload.scaleBarcodeEnabled && payload.saleMode === 'WEIGHT'
        ? scaleBarcodeType === 'PRICE'
          ? 'PRICE'
          : 'WEIGHT'
        : null;

    if (!payload.scaleBarcodeEnabled || payload.saleMode !== 'WEIGHT') {
      payload.scaleBarcodeEnabled = false;
      payload.scaleBarcodePrefix = null;
      payload.scaleBarcodeProductCode = null;
      payload.scaleBarcodeType = null;
    }

    const rawMinimumStock =
      payload?.minimumStock !== undefined
        ? payload.minimumStock
        : current?.minimumStock;

    if (
      rawMinimumStock === null ||
      rawMinimumStock === undefined ||
      rawMinimumStock === ''
    ) {
      payload.minimumStock = 0;
      return;
    }

    const minimumStock = Number(rawMinimumStock);
    if (!Number.isFinite(minimumStock) || minimumStock < 0) {
      throw new BadRequestException(
        'Estoque minimo deve ser um numero maior ou igual a zero.',
      );
    }

    payload.minimumStock = minimumStock;
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

  private async ensureBarcodeIsUnique(
    barcodeValue: unknown,
    ignoreProductId?: number,
  ) {
    const normalizedBarcode = this.normalizeBarcode(barcodeValue);
    if (!normalizedBarcode) return;

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .where('LOWER(product.barcode) = LOWER(:barcode)', {
        barcode: normalizedBarcode,
      });

    if (ignoreProductId) {
      qb.andWhere('product.id != :id', { id: ignoreProductId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException('Código de barras já cadastrado.');
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
  private isProductionUpload() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private resolveFileExtension(originalName?: string, mimeType?: string) {
    const originalExtension = extname(String(originalName || '')).toLowerCase();
    if (originalExtension) {
      return originalExtension;
    }

    const mimeToExtension: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };

    return mimeToExtension[String(mimeType || '').toLowerCase()] || '.bin';
  }
}
