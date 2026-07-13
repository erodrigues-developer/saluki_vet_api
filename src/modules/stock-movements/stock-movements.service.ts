import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager, MoreThan } from 'typeorm';
import { als } from '../../common/utils/als';
import { Product } from '../products/entities/product.entity';
import { ProductCategory } from '../product-categories/entities/product-category.entity';
import { StockBatch } from '../stock-batches/entities/stock-batch.entity';
import { StockLocation } from '../stock-locations/entities/stock-location.entity';
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
const EXPIRING_DAYS = 30;

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
  stockBatchId?: number | null;
  lotCode?: string | null;
  expirationDate?: string | null;
};

type StockOutRequest = StockMovementBaseRequest & {
  autoSelectByExpiration?: boolean;
};
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
  stockBatchId?: number | null;
};

type MovementContext = {
  product: Product;
  stockLocation: StockLocation;
  quantity: number;
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
    const [product, stockLocation, currentStock, nextBatch, hasTrackedBatches] = await Promise.all([
      manager.getRepository(Product).findOne({
        where: { id: productId },
        relations: ['productCategory'],
      }),
      manager.getRepository(StockLocation).findOne({
        where: { id: stockLocationId },
      }),
      this.getCurrentStock(manager, productId, stockLocationId),
      this.getNextAvailableBatch(manager, productId, stockLocationId),
      this.hasTrackedBatches(manager, productId, stockLocationId),
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
      tracksExpiration: hasTrackedBatches,
      nextExpirationDate: nextBatch?.expirationDate ?? null,
      nextLotCode: nextBatch?.lotCode ?? null,
    };
  }

  async listBatches(params: {
    manager: EntityManager;
    productId?: number;
    stockLocationId?: number;
    expirationStatus?: string;
  }) {
    const qb = params.manager
      .getRepository(StockBatch)
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('batch.stockLocation', 'stockLocation')
      .where('batch.remainingQuantity > 0')
      .orderBy('batch.expirationDate', 'ASC')
      .addOrderBy('batch.id', 'ASC');

    if (params.productId) {
      qb.andWhere('batch.productId = :productId', { productId: params.productId });
    }
    if (params.stockLocationId) {
      qb.andWhere('batch.stockLocationId = :stockLocationId', {
        stockLocationId: params.stockLocationId,
      });
    }

    const rows = await qb.getMany();
    return rows.filter((row) =>
      params.expirationStatus
        ? this.getExpirationStatus(row.expirationDate) === params.expirationStatus
        : true,
    );
  }

  async createStockIn(manager: EntityManager, request: StockInRequest) {
    const { product, stockLocation, quantity } =
      await this.validateMovementContext(manager, request);

    let stockBatch: StockBatch | null = null;
    const hasExpirationPayload =
      String(request.lotCode || '').trim().length > 0 ||
      String(request.expirationDate || '').trim().length > 0;
    if (hasExpirationPayload) {
      const lotCode = String(request.lotCode || '').trim();
      const expirationDate = this.normalizeExpirationDate(request.expirationDate);
      if (!lotCode || !expirationDate) {
        throw new BadRequestException(
          'Entrada com validade exige lote e data de validade.',
        );
      }

      stockBatch = await this.upsertBatch(manager, {
        productId: product.id,
        stockLocationId: stockLocation.id,
        lotCode,
        expirationDate,
        quantity,
        unitCost:
          request.unitCost !== undefined
            ? Number(request.unitCost)
            : product.costPrice ?? null,
      });
    }

    return this.persistMovement(manager, {
      productId: product.id,
      stockLocationId: stockLocation.id,
      stockBatchId: stockBatch?.id ?? null,
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

    const hasTrackedBatches = await this.hasTrackedBatches(
      manager,
      product.id,
      stockLocation.id,
    );

    if (!hasTrackedBatches) {
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

    const batches = await this.resolveBatchesForOut(
      manager,
      product.id,
      stockLocation.id,
      quantity,
      request.stockBatchId ?? null,
      request.autoSelectByExpiration ?? true,
    );

    const created = [];
    for (const item of batches) {
      item.batch.remainingQuantity = Number(
        (Number(item.batch.remainingQuantity) - item.quantity).toFixed(3),
      );
      await manager.getRepository(StockBatch).save(item.batch);
      created.push(
        await this.persistMovement(manager, {
          productId: product.id,
          stockLocationId: stockLocation.id,
          stockBatchId: item.batch.id,
          movementType: 'OUT',
          quantity: item.quantity,
          unitCost:
            request.unitCost !== undefined
              ? Number(request.unitCost)
              : item.batch.unitCost ?? product.costPrice ?? null,
          occurredAt: request.occurredAt ?? new Date(),
          referenceType: request.referenceType ?? 'MANUAL_OUT',
          referenceId: request.referenceId ?? null,
          notes: request.notes ?? null,
          reason: request.reason ?? null,
        }),
      );
    }

    return created.length === 1
      ? created[0]
      : {
          split: true,
          movements: created,
        };
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

    const hasTrackedBatches = await this.hasTrackedBatches(
      manager,
      product.id,
      stockLocation.id,
    );

    if (hasTrackedBatches && !request.stockBatchId) {
      throw new BadRequestException(
        'Produtos com controle de validade exigem seleção do lote para ajuste.',
      );
    }

    const currentStock = hasTrackedBatches
      ? await this.getBatchCurrentStock(
          manager,
          request.stockBatchId as number,
          product.id,
          stockLocation.id,
        )
      : await this.getCurrentStock(manager, product.id, stockLocation.id);

    const difference = Number((countedStock - currentStock).toFixed(3));

    if (difference === 0) {
      return {
        changed: false,
        currentStock,
        countedStock,
      };
    }

    const movementType = difference > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
    const quantity = Math.abs(difference);
    let stockBatch: StockBatch | null = null;

    if (movementType === 'ADJUSTMENT_OUT') {
      this.ensureEnoughStock({
        currentStock,
        requestedQuantity: quantity,
      });
    }

    if (hasTrackedBatches) {
      stockBatch = await this.getRequiredBatch(
        manager,
        request.stockBatchId as number,
        product.id,
        stockLocation.id,
      );

      stockBatch.remainingQuantity = Number(
        (
          Number(stockBatch.remainingQuantity) +
          (movementType === 'ADJUSTMENT_IN' ? quantity : -quantity)
        ).toFixed(3),
      );

      if (movementType === 'ADJUSTMENT_IN') {
        stockBatch.initialQuantity = Number(
          (Number(stockBatch.initialQuantity) + quantity).toFixed(3),
        );
      }

      await manager.getRepository(StockBatch).save(stockBatch);
    }

    const movement = await this.persistMovement(manager, {
      productId: product.id,
      stockLocationId: stockLocation.id,
      stockBatchId: stockBatch?.id ?? null,
      movementType,
      quantity,
      unitCost: stockBatch?.unitCost ?? product.costPrice ?? null,
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
    expirationStatus?: string;
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

    const products = await productQb.orderBy('product.name', 'ASC').getMany();
    const trackedProductIds = products
      .filter((product) => product.trackStock)
      .map((product) => product.id);

    const [aggregates, batches] = await Promise.all([
      trackedProductIds.length
        ? this.getAggregatedStocks(
            params.manager,
            trackedProductIds,
            locations.map((location) => location.id),
          )
        : [],
      trackedProductIds.length
        ? this.listBatches({
            manager: params.manager,
            expirationStatus: params.expirationStatus,
          })
        : [],
    ]);

    const aggregateMap = new Map<string, number>();
    for (const row of aggregates) {
      aggregateMap.set(
        `${row.productId}:${row.stockLocationId}`,
        Number(row.quantity || 0),
      );
    }

    const batchMap = new Map<string, StockBatch[]>();
    for (const batch of batches) {
      const key = `${batch.productId}:${batch.stockLocationId}`;
      batchMap.set(key, [...(batchMap.get(key) || []), batch]);
    }

    const rows = products.flatMap((product) => {
      if (!product.trackStock) {
        return [
          this.buildBalanceRow({
            product,
            stockLocation: null,
            currentStock: null,
            batches: [],
          }),
        ];
      }

      return locations.map((stockLocation) =>
        this.buildBalanceRow({
          product,
          stockLocation,
          currentStock: aggregateMap.get(`${product.id}:${stockLocation.id}`) ?? 0,
          batches: batchMap.get(`${product.id}:${stockLocation.id}`) || [],
        }),
      );
    });

    const filteredRows = rows.filter((row) => {
      if (params.status && params.status !== 'ALL' && row.status !== params.status) {
        return false;
      }
      if (
        params.expirationStatus &&
        params.expirationStatus !== 'ALL' &&
        row.expirationStatus !== params.expirationStatus
      ) {
        return false;
      }
      return true;
    });

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
    expirationStatus?: string;
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;

    const qb = params.manager
      .getRepository(StockMovement)
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('product.productCategory', 'productCategory')
      .leftJoinAndSelect('movement.stockLocation', 'stockLocation')
      .leftJoinAndSelect('movement.stockBatch', 'stockBatch')
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
    const filtered = data.filter((item) =>
      params.expirationStatus
        ? this.getExpirationStatus(item.stockBatch?.expirationDate || null) ===
          params.expirationStatus
        : true,
    );

    return {
      data: filtered,
      meta: {
        page,
        limit,
        total: params.expirationStatus ? filtered.length : total,
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
    const existingReversal = await params.manager
      .getRepository(StockMovement)
      .findOne({
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
      relations: ['stockBatch'],
      order: { id: 'ASC' },
    });

    if (!originalMovements.length) {
      throw new ConflictException(
        'Não foi possível localizar as movimentações originais da venda para estorno de estoque.',
      );
    }

    for (const movement of originalMovements) {
      if (movement.stockBatchId) {
        const batch = await params.manager.getRepository(StockBatch).findOne({
          where: { id: movement.stockBatchId },
        });
        if (batch) {
          batch.remainingQuantity = Number(
            (Number(batch.remainingQuantity) + Number(movement.quantity)).toFixed(3),
          );
          await params.manager.getRepository(StockBatch).save(batch);
        }
      }

      await this.persistMovement(params.manager, {
        productId: movement.productId,
        stockLocationId: movement.stockLocationId,
        stockBatchId: movement.stockBatchId ?? null,
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

      if (await this.hasTrackedBatches(manager, productId, defaultLocation.id)) {
        const available = await this.getConsumableBatches(
          manager,
          productId,
          defaultLocation.id,
        );
        const batchStock = available.reduce(
          (acc, item) => acc + Number(item.remainingQuantity || 0),
          0,
        );
        if (batchStock < quantity) {
          this.throwInsufficientStockError(batchStock, quantity);
        }
      }
    }

    return defaultLocation;
  }

  getManualOutReasons() {
    return MANUAL_OUT_REASONS;
  }

  private async validateMovementContext(
    manager: EntityManager,
    request: StockMovementBaseRequest,
    skipQuantityValidation = false,
  ): Promise<MovementContext> {
    const quantity = Number(request.quantity);
    if (!skipQuantityValidation && (!Number.isFinite(quantity) || quantity <= 0)) {
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

    return { product, stockLocation, quantity };
  }

  private async persistMovement(
    manager: EntityManager,
    payload: {
      productId: number;
      stockLocationId: number;
      stockBatchId?: number | null;
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

    if (
      payload.referenceId &&
      payload.referenceType &&
      !['SALE', 'TREATMENT_MAP'].includes(String(payload.referenceType))
    ) {
      const qb = movementRepository
        .createQueryBuilder('movement')
        .where('movement.productId = :productId', {
          productId: payload.productId,
        })
        .andWhere('movement.stockLocationId = :stockLocationId', {
          stockLocationId: payload.stockLocationId,
        })
        .andWhere('movement.referenceType = :referenceType', {
          referenceType: payload.referenceType,
        })
        .andWhere('movement.referenceId = :referenceId', {
          referenceId: payload.referenceId,
        })
        .andWhere('movement.movementType = :movementType', {
          movementType: payload.movementType,
        });

      if (payload.stockBatchId) {
        qb.andWhere('movement.stockBatchId = :stockBatchId', {
          stockBatchId: payload.stockBatchId,
        });
      } else {
        qb.andWhere('movement.stockBatchId IS NULL');
      }

      const existing = await qb.getOne();

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

  private async upsertBatch(
    manager: EntityManager,
    params: {
      productId: number;
      stockLocationId: number;
      lotCode: string;
      expirationDate: string;
      quantity: number;
      unitCost?: number | null;
    },
  ) {
    const repository = manager.getRepository(StockBatch);
    const existing = await repository.findOne({
      where: {
        productId: params.productId,
        stockLocationId: params.stockLocationId,
        lotCode: params.lotCode,
        expirationDate: params.expirationDate,
      },
    });

    if (existing) {
      existing.initialQuantity = Number(
        (Number(existing.initialQuantity) + params.quantity).toFixed(3),
      );
      existing.remainingQuantity = Number(
        (Number(existing.remainingQuantity) + params.quantity).toFixed(3),
      );
      existing.unitCost =
        params.unitCost !== undefined ? params.unitCost : existing.unitCost;
      return repository.save(existing);
    }

    return repository.save(
      repository.create({
        ...params,
        initialQuantity: params.quantity,
        remainingQuantity: params.quantity,
      }),
    );
  }

  private async resolveBatchesForOut(
    manager: EntityManager,
    productId: number,
    stockLocationId: number,
    quantity: number,
    stockBatchId?: number | null,
    autoSelectByExpiration = true,
  ) {
    if (stockBatchId) {
      const batch = await this.getRequiredBatch(
        manager,
        stockBatchId,
        productId,
        stockLocationId,
      );
      this.ensureEnoughStock({
        currentStock: Number(batch.remainingQuantity),
        requestedQuantity: quantity,
      });
      return [{ batch, quantity }];
    }

    if (!autoSelectByExpiration) {
      throw new BadRequestException('Selecione um lote para concluir a saída.');
    }

    const available = await this.getConsumableBatches(
      manager,
      productId,
      stockLocationId,
    );

    let remaining = quantity;
    const allocations: Array<{ batch: StockBatch; quantity: number }> = [];

    for (const batch of available) {
      if (remaining <= 0) break;
      const usable = Math.min(Number(batch.remainingQuantity), remaining);
      if (usable <= 0) continue;
      allocations.push({ batch, quantity: Number(usable.toFixed(3)) });
      remaining = Number((remaining - usable).toFixed(3));
    }

    if (remaining > 0) {
      this.throwInsufficientStockError(quantity - remaining, quantity);
    }

    return allocations;
  }

  private async getConsumableBatches(
    manager: EntityManager,
    productId: number,
    stockLocationId: number,
  ) {
    const today = this.todayString();
    return manager.getRepository(StockBatch).find({
      where: {
        productId,
        stockLocationId,
        remainingQuantity: MoreThan(0) as any,
      },
      order: {
        expirationDate: 'ASC',
        id: 'ASC',
      },
    }).then((rows) => rows.filter((row) => row.expirationDate >= today));
  }

  private async getNextAvailableBatch(
    manager: EntityManager,
    productId: number,
    stockLocationId: number,
  ) {
    const batches = await this.getConsumableBatches(manager, productId, stockLocationId);
    return batches[0] ?? null;
  }

  private async hasTrackedBatches(
    manager: EntityManager,
    productId: number,
    stockLocationId: number,
  ) {
    const count = await manager.getRepository(StockBatch).count({
      where: {
        productId,
        stockLocationId,
        remainingQuantity: MoreThan(0) as any,
      },
    });
    return count > 0;
  }

  private async getRequiredBatch(
    manager: EntityManager,
    stockBatchId: number,
    productId: number,
    stockLocationId: number,
  ) {
    const batch = await manager.getRepository(StockBatch).findOne({
      where: {
        id: stockBatchId,
        productId,
        stockLocationId,
      },
    });
    if (!batch) {
      throw new BadRequestException('Lote informado não encontrado para o produto/local.');
    }
    return batch;
  }

  private async getBatchCurrentStock(
    manager: EntityManager,
    stockBatchId: number,
    productId: number,
    stockLocationId: number,
  ) {
    const batch = await this.getRequiredBatch(
      manager,
      stockBatchId,
      productId,
      stockLocationId,
    );
    return Number(batch.remainingQuantity || 0);
  }

  private normalizeExpirationDate(value?: string | null) {
    const normalized = String(value || '').trim();
    if (!normalized) return null;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Data de validade inválida.');
    }
    return date.toISOString().slice(0, 10);
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
    batches: StockBatch[];
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

    const expirationStatuses = params.batches.map((batch) =>
      this.getExpirationStatus(batch.expirationDate),
    );
    const nextBatch = [...params.batches].sort((a, b) =>
      a.expirationDate.localeCompare(b.expirationDate),
    )[0];
    const tracksExpiration = params.batches.length > 0
    const expirationStatus = !tracksExpiration
      ? 'UNTRACKED'
      : expirationStatuses.includes('EXPIRED')
        ? 'EXPIRED'
        : expirationStatuses.includes('EXPIRING')
          ? 'EXPIRING'
          : expirationStatuses.includes('VALID')
            ? 'VALID'
            : 'UNTRACKED';

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
      expirationStatus,
      nextExpirationDate: nextBatch?.expirationDate ?? null,
      expiringLotsCount: expirationStatuses.filter((item) => item === 'EXPIRING').length,
      expiredLotsCount: expirationStatuses.filter((item) => item === 'EXPIRED').length,
      costPrice: params.product.costPrice ?? null,
      salePrice: params.product.salePrice ?? null,
      unit: params.product.unit ?? null,
      trackStock: params.product.trackStock,
      tracksExpiration,
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
        if (row.expirationStatus === 'EXPIRING') acc.expiring += 1;
        if (row.expirationStatus === 'EXPIRED') acc.expired += 1;
        return acc;
      },
      {
        total: 0,
        normal: 0,
        low: 0,
        zero: 0,
        untracked: 0,
        expiring: 0,
        expired: 0,
      },
    );
  }

  private getExpirationStatus(expirationDate?: string | null) {
    if (!expirationDate) return 'UNTRACKED';
    const today = this.todayString();
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + EXPIRING_DAYS);
    const expiringLimit = limitDate.toISOString().slice(0, 10);
    if (expirationDate < today) return 'EXPIRED';
    if (expirationDate <= expiringLimit) return 'EXPIRING';
    return 'VALID';
  }

  private todayString() {
    return new Date().toISOString().slice(0, 10);
  }
}
