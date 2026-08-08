import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { StockMovementsService } from './stock-movements.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('stock-movements')
@ApiBearerAuth()
@Controller('stock-movements')
export class StockMovementsController {
  constructor(
    private readonly stockMovementsService: StockMovementsService,
    private readonly dataSource: DataSource,
  ) {}

  @Get('balance')
  @Permissions('estoque.balances.view', 'dashboard.view')
  @ApiOperation({ summary: 'Listar saldos de estoque por produto/local' })
  getBalance(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('stockLocationId') stockLocationId?: string,
    @Query('productCategoryId') productCategoryId?: string,
    @Query('status') status?: string,
    @Query('expirationStatus') expirationStatus?: string,
  ) {
    return this.stockMovementsService.getStockBalance({
      manager: this.dataSource.manager,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search,
      stockLocationId: stockLocationId ? Number(stockLocationId) : undefined,
      productCategoryId: productCategoryId ? Number(productCategoryId) : undefined,
      status,
      expirationStatus,
    });
  }

  @Get('history')
  @Permissions('estoque.movements.view')
  @ApiOperation({ summary: 'Listar histórico de movimentações de estoque' })
  getHistory(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('productId') productId?: string,
    @Query('stockLocationId') stockLocationId?: string,
    @Query('movementType') movementType?: string,
    @Query('referenceType') referenceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('expirationStatus') expirationStatus?: string,
  ) {
    return this.stockMovementsService.getMovementHistory({
      manager: this.dataSource.manager,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      productId: productId ? Number(productId) : undefined,
      stockLocationId: stockLocationId ? Number(stockLocationId) : undefined,
      movementType,
      referenceType,
      startDate,
      endDate,
      expirationStatus,
    });
  }

  @Get('batches')
  @Permissions('estoque.batches.view')
  @ApiOperation({ summary: 'Listar lotes disponíveis de estoque' })
  getBatches(
    @Query('productId') productId?: string,
    @Query('stockLocationId') stockLocationId?: string,
    @Query('expirationStatus') expirationStatus?: string,
  ) {
    return this.stockMovementsService.listBatches({
      manager: this.dataSource.manager,
      productId: productId ? Number(productId) : undefined,
      stockLocationId: stockLocationId ? Number(stockLocationId) : undefined,
      expirationStatus,
    });
  }

  @Get('current-stock')
  @Permissions('estoque.balances.view', 'estoque.movements.view')
  @ApiOperation({ summary: 'Consultar saldo atual de um produto em um local' })
  getCurrentStock(
    @Query('productId') productId?: string,
    @Query('stockLocationId') stockLocationId?: string,
  ) {
    return this.stockMovementsService.getCurrentStockSnapshot({
      manager: this.dataSource.manager,
      productId: Number(productId),
      stockLocationId: Number(stockLocationId),
    });
  }

  @Get('manual-out-reasons')
  @Permissions('estoque.movements.out')
  @ApiOperation({ summary: 'Listar motivos de saída manual' })
  getManualOutReasons() {
    return this.stockMovementsService.getManualOutReasons().map((label) => ({
      label,
      value: label,
    }));
  }

  @Post('in')
  @Permissions('estoque.movements.in')
  @ApiOperation({ summary: 'Registrar entrada manual de estoque' })
  createStockIn(@Body() payload: any) {
    return this.dataSource.transaction((manager) =>
      this.stockMovementsService.createStockIn(manager, {
        productId: Number(payload.productId),
        stockLocationId: payload.stockLocationId
          ? Number(payload.stockLocationId)
          : undefined,
        quantity: Number(payload.quantity),
        unitCost:
          payload.unitCost === null || payload.unitCost === undefined
            ? null
            : Number(payload.unitCost),
        occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
        referenceType: payload.referenceType || 'MANUAL_ENTRY',
        referenceId: payload.referenceId ? Number(payload.referenceId) : null,
        notes: payload.notes ?? null,
        reason: payload.reason ?? null,
        lotCode: payload.lotCode ?? null,
        expirationDate: payload.expirationDate ?? null,
        stockBatchId: payload.stockBatchId ? Number(payload.stockBatchId) : null,
      }),
    );
  }

  @Post('out')
  @Permissions('estoque.movements.out')
  @ApiOperation({ summary: 'Registrar saída manual de estoque' })
  createStockOut(@Body() payload: any) {
    return this.dataSource.transaction((manager) =>
      this.stockMovementsService.createStockOut(manager, {
        productId: Number(payload.productId),
        stockLocationId: payload.stockLocationId
          ? Number(payload.stockLocationId)
          : undefined,
        quantity: Number(payload.quantity),
        occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
        referenceType: payload.referenceType || 'MANUAL_OUT',
        referenceId: payload.referenceId ? Number(payload.referenceId) : null,
        notes: payload.notes ?? null,
        reason: payload.reason ?? null,
        stockBatchId: payload.stockBatchId ? Number(payload.stockBatchId) : null,
        autoSelectByExpiration:
          payload.autoSelectByExpiration === undefined
            ? true
            : Boolean(payload.autoSelectByExpiration),
      }),
    );
  }

  @Post('adjust')
  @Permissions('estoque.movements.adjust')
  @ApiOperation({ summary: 'Ajustar saldo de estoque' })
  createStockAdjustment(@Body() payload: any) {
    return this.dataSource.transaction((manager) =>
      this.stockMovementsService.createStockAdjustment(manager, {
        productId: Number(payload.productId),
        stockLocationId: Number(payload.stockLocationId),
        countedStock: Number(payload.countedStock),
        reason: payload.reason,
        notes: payload.notes ?? null,
        occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
        referenceType: payload.referenceType || 'MANUAL_ADJUSTMENT',
        referenceId: payload.referenceId ? Number(payload.referenceId) : null,
        stockBatchId: payload.stockBatchId ? Number(payload.stockBatchId) : null,
      }),
    );
  }
}
