import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { StockLocation } from '../stock-locations/entities/stock-location.entity';
import { StockMovement } from './entities/stock-movement.entity';

const POSITIVE_MOVEMENT_TYPES = ['IN', 'ADJUSTMENT_IN'];
const NEGATIVE_MOVEMENT_TYPES = ['OUT', 'ADJUSTMENT_OUT'];

type StockOutRequest = {
  productId: number;
  quantity: number;
  referenceType: string;
  referenceId: number;
  notes?: string | null;
  occurredAt?: Date;
};

type StockAdjustmentRequest = {
  productId: number;
  quantity: number;
  direction: 'IN' | 'OUT';
  referenceType: string;
  referenceId: number;
  notes?: string | null;
  occurredAt?: Date;
};

@Injectable()
export class StockMovementsService {
  async getCurrentStock(manager: EntityManager, productId: number) {
    const result = await manager
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
      })
      .getRawOne<{ quantity: string }>();

    return Number(result?.quantity || 0);
  }

  async createStockOut(manager: EntityManager, request: StockOutRequest) {
    const quantity = Number(request.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantidade de estoque invalida.');
    }

    const product = await manager
      .getRepository(Product)
      .createQueryBuilder('product')
      .setLock('pessimistic_write')
      .where('product.id = :id', { id: request.productId })
      .getOne();

    if (!product || !product.isActive) {
      throw new BadRequestException(
        `Produto ${request.productId} inexistente.`,
      );
    }

    if (!product.trackStock) {
      return null;
    }

    const currentStock = await this.getCurrentStock(manager, product.id);
    if (currentStock < quantity) {
      throw new BadRequestException(
        `Estoque insuficiente para ${product.name}. Disponivel: ${currentStock}.`,
      );
    }

    const stockLocation = await this.getDefaultStockLocation(manager);

    const movementRepository = manager.getRepository(StockMovement);
    const existing = await movementRepository.findOne({
      where: {
        productId: product.id,
        referenceType: request.referenceType,
        referenceId: request.referenceId,
        movementType: 'OUT',
      },
    });
    if (existing) {
      return existing;
    }

    return movementRepository.save(
      movementRepository.create({
        productId: product.id,
        stockLocationId: stockLocation.id,
        movementType: 'OUT',
        quantity,
        unitCost: product.costPrice ?? null,
        occurredAt: request.occurredAt ?? new Date(),
        referenceType: request.referenceType,
        referenceId: request.referenceId,
        notes: request.notes ?? null,
      }),
    );
  }

  async createStockAdjustment(
    manager: EntityManager,
    request: StockAdjustmentRequest,
  ) {
    const quantity = Number(request.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantidade de estoque invalida.');
    }

    const product = await manager
      .getRepository(Product)
      .createQueryBuilder('product')
      .setLock('pessimistic_write')
      .where('product.id = :id', { id: request.productId })
      .getOne();

    if (!product || !product.isActive) {
      throw new BadRequestException(
        `Produto ${request.productId} inexistente.`,
      );
    }

    if (!product.trackStock) {
      return null;
    }

    const movementType =
      request.direction === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';

    if (movementType === 'ADJUSTMENT_OUT') {
      const currentStock = await this.getCurrentStock(manager, product.id);
      if (currentStock < quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para ${product.name}. Disponivel: ${currentStock}.`,
        );
      }
    }

    const stockLocation = await this.getDefaultStockLocation(manager);
    const movementRepository = manager.getRepository(StockMovement);

    return movementRepository.save(
      movementRepository.create({
        productId: product.id,
        stockLocationId: stockLocation.id,
        movementType,
        quantity,
        unitCost: product.costPrice ?? null,
        occurredAt: request.occurredAt ?? new Date(),
        referenceType: request.referenceType,
        referenceId: request.referenceId,
        notes: request.notes ?? null,
      }),
    );
  }

  private async getDefaultStockLocation(manager: EntityManager) {
    const stockLocation = await manager.getRepository(StockLocation).findOne({
      where: { isDefault: true },
    });
    if (!stockLocation) {
      throw new BadRequestException('Local de estoque padrao nao configurado.');
    }
    return stockLocation;
  }
}
