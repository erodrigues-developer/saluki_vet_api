import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { als } from '../../common/utils/als';
import { Product } from '../products/entities/product.entity';
import { ProductCategory } from '../product-categories/entities/product-category.entity';
import { StockLocation } from '../stock-locations/entities/stock-location.entity';
import { User } from '../users/entities/user.entity';
import { StockMovement } from './entities/stock-movement.entity';

const POSITIVE_MOVEMENT_TYPES = ['IN', 'ADJUSTMENT_IN'];
const NEGATIVE_MOVEMENT_TYPES = ['OUT', 'ADJUSTMENT_OUT'];
const MANUAL_OUT_REASONS = [
  'Uso em atendimento',
  'Perda',
  'Vencimento',
  'Ajuste negativo',
  'Outro',
];

type StockMovementBaseRequest = {
  productId: number;
  stockLocationId?: number | null;
  quantity: number;
  referenceType?: string | null;
  referenceId?: number | null;
  notes?: string | null;
  reason?: string | null;
  occurredAt?: Date;
  unitCost?: number | null;
};

type StockOutRequest = StockMovementBaseRequest;
type StockInRequest = StockMovementBaseRequest;

type StockAdjustmentRequest = {
  productId: number;
  stockLocationId: number;
  countedStock: number;
  reason: string;
  notes?: string | null;
  occurredAt?: Date;
  referenceType?: string | null;
  referenceId?: number | null;
};

@Injectable()
export class StockMovementsService {
  async getCurrentStock(
    manager: EntityManager,
    productId: number,
    stockLocationId?: number | null,
  ) {
    const qb = manager
      .getRepository(StockMovement)
      .createQueryBuilder('movement')
      .select(
        `COALESCE(SUM(CASE
          WHEN movement.movementType IN (:...positiveTypes) THEN movement.quantity
          WHEN movement.movementType IN (:...negativeTypes) THEN -movement.quantity
          ELSE 0
        END), 0)`,
        'quantity',
      )
      .where('movement.productId = :productId', { productId })
      .setParameters({
        positiveTypes: POSITIVE_MOVEMENT_TYPES,
        negativeTypes: NEGATIVE_MOVEMENT_TYPES,
      });

    if (stockLocationId) {
      qb.andWhere('movement.stockLocationId = :stockLocationId', {
        stockLocationId,
      });
    }

    const result = await qb.getRawOne<{ quantity: string }>();
    return Number(result?.quantity || 0);
  }

  async getCurrentStockSnapshot(params: {
    manager: EntityManager;
    productId: number;
    stockLocationId: number;
  }) {
    const { manager, productId, stockLocationId } = params;
    const [product, stockLocation, currentStock] = await Promise.all([
      manager.getRepository(Product).findOne({
        where: { id: productId },
        relations: ['productCategory'],
      }),
      manager.getRepository(StockLocation).findOne({
        where: { id: stockLocationId },
      }),
      this.getCurrentStock(manager, productId, stockLocationId),
    ]);

    if (!product || !product.isActive) {
      throw new BadRequestException(`Produto ${productId} inexistente.`);
    }

    if (!stockLocation) {
      throw new BadRequestException(
        `Local de estoque ${stockLocationId} inexistente.`,
      );
    }

    return {
      productId: product.id,
      productName: product.name,
      stockLocationId: stockLocation.id,
      stockLocationName: stockLocation.name,
      currentStock,
      minimumStock: product.minimumStock ?? 0,
      trackStock: product.trackStock,
    };
  }

  async createStockIn(manager: EntityManager, request: StockInRequest) {
    const { product, stockLocation, quantity } =
      await this.validateMovementContext(manager, request);

    return this.persistMovement(manager, {
      productId: product.id,
      stockLocationId: stockLocation.id,
      movementType: 'IN',
      quantity,
      unitCost:
        request.unitCost !== undefined
          ? Number(request.unitCost)
          : product.costPrice ?? null,
      occurredAt: request.occurredAt ?? new Date(),
      referenceType: request.referenceType ?? 'MANUAL_ENTRY',
      referenceId: request.referenceId ?? null,
      notes: request.notes ?? null,
      reason: request.reason ?? null,
    });
  }

  async createStockOut(manager: EntityManager, request: StockOutRequest) {
    const { product, stockLocation, quantity } =
      await this.validateMovementContext(manager, request);

    const currentStock = await this.getCurrentStock(
      manager,
      product.id,
      stockLocation.id,
    );
    this.ensureEnoughStock({
      currentStock,
      requestedQuantity: quantity,
    });

    return this.persistMovement(manager, {
      productId: product.id,
      stockLocationId: stockLocation.id,
      movementType: 'OUT',
      quantity,
      unitCost:
        request.unitCost !== undefined
          ? Number(request.unitCost)
          : product.costPrice ?? null,
      occurredAt: request.occurredAt ?? new Date(),
      referenceType: request.referenceType ?? 'MANUAL_OUT',
      referenceId: request.referenceId ?? null,
      notes: request.notes ?? null,
      reason: request.reason ?? null,
    });
  }

  async createStockAdjustment(
    manager: EntityManager,
    request: StockAdjustmentRequest,
  ) {
    const countedStock = Number(request.countedStock);
    if (!Number.isFinite(countedStock) || countedStock < 0) {
      throw new BadRequestException(
        'Saldo contado deve ser um número maior ou igual a zero.',
      );
    }

    const reason = String(request.reason || '').trim();
    if (!reason) {
      throw new BadRequestException('Motivo do ajuste é obrigatório.');
    }

    const { product, stockLocation } = await this.validateMovementContext(
      manager,
      {
        productId: request.productId,
        stockLocationId: request.stockLocationId,
        quantity: 0.001,
      },
      true,
    );

    const currentStock = await this.getCurrentStock(
      manager,
      product.id,
      stockLocation.id,
    );
    const difference = Number((countedStock - currentStock).toFixed(3));

    if (difference === 0) {
      return {
        changed: false,
        currentStock,
        countedStock,
      };
    }

    const movementType =
      difference > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';

    if (movementType === 'ADJUSTMENT_OUT') {
      this.ensureEnoughStock({
        currentStock,
        requestedQuantity: Math.abs(difference),
      });
    }

    const movement = await this.persistMovement(manager, {
      productId: product.id,
      stockLocationId: stockLocation.id,
      movementType,
      quantity: Math.abs(difference),
      unitCost: product.costPrice ?? null,
      occurredAt: request.occurredAt ?? new Date(),
      referenceType: request.referenceType ?? 'MANUAL_ADJUSTMENT',
      referenceId: request.referenceId ?? null,
      notes: request.notes ?? null,
      reason,
    });

    return {
      changed: true,
      currentStock,
      countedStock,
      movement,
    };
  }

  async getStockBalance(params: {
    manager: EntityManager;
    page?: number;
    limit?: number;
    search?: string;
    stockLocationId?: number;
    productCategoryId?: number;
    status?: string;
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;

    const productQb = params.manager
      .getRepository(Product)
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productCategory', 'productCategory')
      .where('product.isActive = true')
      .andWhere('product.isService = false');

    if (params.search) {
      productQb.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(COALESCE(product.sku, \'\')) LIKE LOWER(:search) OR LOWER(COALESCE(product.barcode, \'\')) LIKE LOWER(:search))',
        { search: `%${String(params.search).trim()}%` },
      );
    }

    if (params.productCategoryId) {
      productQb.andWhere('product.productCategoryId = :productCategoryId', {
        productCategoryId: params.productCategoryId,
      });
    }

    const locations = await params.manager.getRepository(StockLocation).find({
      where: params.stockLocationId
        ? { id: params.stockLocationId }
        : { isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' },
    });

    const products = await productQb
      .orderBy('product.name', 'ASC')
      .getMany();

    const trackedProductIds = products
      .filter((product) => product.trackStock)
      .map((product) => product.id);

    const aggregates = trackedProductIds.length
      ? await this.getAggregatedStocks(
          params.manager,
          trackedProductIds,
          locations.map((location) => location.id),
        )
      : [];

    const aggregateMap = new Map<string, number>();
    for (const row of aggregates) {
      aggregateMap.set(
        `${row.productId}:${row.stockLocationId}`,
        Number(row.quantity || 0),
      );
    }

    const rows = products.flatMap((product) => {
      if (!product.trackStock) {
        return [
          this.buildBalanceRow({
            product,
            stockLocation: null,
            currentStock: null,
          }),
        ];
      }

      return locations.map((stockLocation) =>
        this.buildBalanceRow({
          product,
          stockLocation,
          currentStock:
            aggregateMap.get(`${product.id}:${stockLocation.id}`) ?? 0,
        }),
      );
    });

    const filteredRows =
      params.status && params.status !== 'ALL'
        ? rows.filter((row) => row.status === params.status)
        : rows;

    const paginated = filteredRows.slice((page - 1) * limit, page * limit);
    const summary = this.buildBalanceSummary(rows);

    return {
      data: paginated,
      meta: {
        page,
        limit,
        total: filteredRows.length,
        summary,
      },
    };
  }

  async getMovementHistory(params: {
    manager: EntityManager;
    page?: number;
    limit?: number;
    productId?: number;
    stockLocationId?: number;
    movementType?: string;
    referenceType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;

    const qb = params.manager
      .getRepository(StockMovement)
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('product.productCategory', 'productCategory')
      .leftJoinAndSelect('movement.stockLocation', 'stockLocation')
      .leftJoinAndSelect('movement.createdByUser', 'createdByUser')
      .orderBy('movement.occurredAt', 'DESC')
      .addOrderBy('movement.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (params.productId) {
      qb.andWhere('movement.productId = :productId', {
        productId: params.productId,
      });
    }

    if (params.stockLocationId) {
      qb.andWhere('movement.stockLocationId = :stockLocationId', {
        stockLocationId: params.stockLocationId,
      });
    }

    if (params.movementType) {
      qb.andWhere('movement.movementType = :movementType', {
        movementType: params.movementType,
      });
    }

    if (params.referenceType) {
      qb.andWhere('movement.referenceType = :referenceType', {
        referenceType: params.referenceType,
      });
    }

    if (params.startDate) {
      qb.andWhere('movement.occurredAt >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      qb.andWhere('movement.occurredAt <= :endDate', {
        endDate: params.endDate,
      });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async reverseSaleMovements(params: {
    manager: EntityManager;
    saleId: number;
    occurredAt: Date;
    referenceType: string;
    notes: string;
  }) {
    const existingReversal = await params.manager.getRepository(StockMovement).findOne({
      where: {
        referenceType: params.referenceType,
        referenceId: params.saleId,
      },
    });

    if (existingReversal) {
      return;
    }

    const originalMovements = await params.manager.getRepository(StockMovement).find({
      where: {
        referenceType: 'SALE',
        referenceId: params.saleId,
      },
      order: { id: 'ASC' },
    });

    if (!originalMovements.length) {
      throw new ConflictException(
        'Não foi possível localizar as movimentações originais da venda para estorno de estoque.',
      );
    }

    for (const movement of originalMovements) {
      await this.persistMovement(params.manager, {
        productId: movement.productId,
        stockLocationId: movement.stockLocationId,
        movementType: 'IN',
        quantity: Number(movement.quantity),
        unitCost: movement.unitCost ?? null,
        occurredAt: params.occurredAt,
        referenceType: params.referenceType,
        referenceId: params.saleId,
        notes: params.notes,
        reason: 'Estorno de venda',
      });
    }
  }

  async ensureSaleItemsHaveStock(
    manager: EntityManager,
    items: Array<{ productId?: number | null; quantity: number }>,
  ) {
    const defaultLocation = await this.getDefaultStockLocation(manager);
    const grouped = new Map<number, number>();

    for (const item of items) {
      if (!item.productId) continue;
      grouped.set(
        item.productId,
        Number((grouped.get(item.productId) || 0) + Number(item.quantity || 0)),
      );
    }

    for (const [productId, quantity] of grouped.entries()) {
      const product = await manager.getRepository(Product).findOne({
        where: { id: productId },
      });

      if (!product || !product.trackStock || product.isService) {
        continue;
      }

      const currentStock = await this.getCurrentStock(
        manager,
        productId,
        defaultLocation.id,
      );

      if (currentStock < quantity) {
        this.throwInsufficientStockError(currentStock, quantity);
      }
    }

    return defaultLocation;
  }

  private async validateMovementContext(
    manager: EntityManager,
    request: StockMovementBaseRequest,
    skipQuantityValidation = false,
  ) {
    const quantity = Number(request.quantity);
    if (
      !skipQuantityValidation &&
      (!Number.isFinite(quantity) || quantity <= 0)
    ) {
      throw new BadRequestException('Quantidade de estoque inválida.');
    }

    const product = await manager
      .getRepository(Product)
      .createQueryBuilder('product')
      .setLock('pessimistic_write')
      .where('product.id = :id', { id: request.productId })
      .getOne();

    if (!product || !product.isActive) {
      throw new BadRequestException(`Produto ${request.productId} inexistente.`);
    }

    if (!product.trackStock || product.isService) {
      throw new BadRequestException(
        `Produto ${product.name} não possui controle de estoque.`,
      );
    }

    const stockLocation = request.stockLocationId
      ? await manager.getRepository(StockLocation).findOne({
          where: { id: request.stockLocationId },
        })
      : await this.getDefaultStockLocation(manager);

    if (!stockLocation) {
      throw new BadRequestException('Local de estoque não encontrado.');
    }

    if (!stockLocation.isActive) {
      throw new BadRequestException(
        'Local de estoque inativo não pode receber novas movimentações.',
      );
    }

    return {
      product,
      stockLocation,
      quantity,
    };
  }

  private async persistMovement(
    manager: EntityManager,
    payload: {
      productId: number;
      stockLocationId: number;
      movementType: string;
      quantity: number;
      unitCost?: number | null;
      occurredAt: Date;
      referenceType?: string | null;
      referenceId?: number | null;
      notes?: string | null;
      reason?: string | null;
    },
  ) {
    const movementRepository = manager.getRepository(StockMovement);

    if (payload.referenceId && payload.referenceType) {
      const existing = await movementRepository.findOne({
        where: {
          productId: payload.productId,
          stockLocationId: payload.stockLocationId,
          referenceType: payload.referenceType,
          referenceId: payload.referenceId,
          movementType: payload.movementType,
        },
      });

      if (existing) {
        return existing;
      }
    }

    const store = als.getStore();
    const createdByUserId = store?.get('userId');

    return movementRepository.save(
      movementRepository.create({
        ...payload,
        createdByUserId: createdByUserId ?? null,
      }),
    );
  }

  async getDefaultStockLocation(manager: EntityManager) {
    const defaults = await manager.getRepository(StockLocation).find({
      where: { isDefault: true, isActive: true },
      take: 2,
      order: { id: 'ASC' },
    });

    if (defaults.length !== 1) {
      throw new BadRequestException(
        'É necessário ter exatamente um local de estoque padrão ativo.',
      );
    }

    return defaults[0];
  }

  private ensureEnoughStock(params: {
    currentStock: number;
    requestedQuantity: number;
  }) {
    if (params.currentStock < params.requestedQuantity) {
      this.throwInsufficientStockError(
        params.currentStock,
        params.requestedQuantity,
      );
    }
  }

  private throwInsufficientStockError(
    currentStock: number,
    requestedQuantity: number,
  ) {
    throw new BadRequestException(
      `Saldo insuficiente para concluir a operação. Saldo disponível: ${currentStock.toFixed(3)}. Quantidade solicitada: ${requestedQuantity.toFixed(3)}.`,
    );
  }

  private async getAggregatedStocks(
    manager: EntityManager,
    productIds: number[],
    stockLocationIds: number[],
  ) {
    if (!productIds.length || !stockLocationIds.length) {
      return [];
    }

    return manager
      .getRepository(StockMovement)
      .createQueryBuilder('movement')
      .select('movement.productId', 'productId')
      .addSelect('movement.stockLocationId', 'stockLocationId')
      .addSelect(
        `COALESCE(SUM(CASE
          WHEN movement.movementType IN (:...positiveTypes) THEN movement.quantity
          WHEN movement.movementType IN (:...negativeTypes) THEN -movement.quantity
          ELSE 0
        END), 0)`,
        'quantity',
      )
      .where('movement.productId IN (:...productIds)', { productIds })
      .andWhere('movement.stockLocationId IN (:...stockLocationIds)', {
        stockLocationIds,
      })
      .groupBy('movement.productId')
      .addGroupBy('movement.stockLocationId')
      .setParameters({
        positiveTypes: POSITIVE_MOVEMENT_TYPES,
        negativeTypes: NEGATIVE_MOVEMENT_TYPES,
      })
      .getRawMany<{ productId: string; stockLocationId: string; quantity: string }>();
  }

  private buildBalanceRow(params: {
    product: Product & { productCategory?: ProductCategory | null };
    stockLocation: StockLocation | null;
    currentStock: number | null;
  }) {
    const minimumStock = Number(params.product.minimumStock ?? 0);
    const currentStock =
      params.currentStock === null ? null : Number(params.currentStock);

    let status = 'NORMAL';
    if (!params.product.trackStock) {
      status = 'UNTRACKED';
    } else if ((currentStock ?? 0) <= 0) {
      status = 'ZERO';
    } else if ((currentStock ?? 0) <= minimumStock) {
      status = 'LOW';
    }

    return {
      productId: params.product.id,
      productName: params.product.name,
      sku: params.product.sku ?? null,
      barcode: params.product.barcode ?? null,
      productCategoryId: params.product.productCategoryId ?? null,
      categoryName: params.product.productCategory?.name ?? null,
      stockLocationId: params.stockLocation?.id ?? null,
      stockLocationName: params.stockLocation?.name ?? 'Não rastreado',
      isDefaultLocation: params.stockLocation?.isDefault ?? false,
      currentStock,
      minimumStock,
      status,
      costPrice: params.product.costPrice ?? null,
      salePrice: params.product.salePrice ?? null,
      unit: params.product.unit ?? null,
      trackStock: params.product.trackStock,
      imgUrl: params.product.imgUrl ?? null,
    };
  }

  private buildBalanceSummary(rows: any[]) {
    return rows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.status === 'ZERO') acc.zero += 1;
        if (row.status === 'LOW') acc.low += 1;
        if (row.status === 'UNTRACKED') acc.untracked += 1;
        if (row.status === 'NORMAL') acc.normal += 1;
        return acc;
      },
      {
        total: 0,
        normal: 0,
        low: 0,
        zero: 0,
        untracked: 0,
      },
    );
  }

  getManualOutReasons() {
    return MANUAL_OUT_REASONS;
  }
}
