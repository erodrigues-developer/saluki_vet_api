import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SalesRepository,
  SalesFilterOptions,
} from './repositories/sales.repository';
import { Sale } from './entities/sale.entity';
import { DataSource, QueryFailedError } from 'typeorm';
import { CheckoutSaleDto } from './dto/checkout-sale.dto';
import { CheckoutSaleResponseDto } from './dto/checkout-sale-response.dto';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { AccountReceivable } from '../accounts-receivable/entities/account-receivable.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { SaleItem } from '../sale-items/entities/sale-item.entity';
import { StockMovementsService } from '../stock-movements/stock-movements.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly dataSource: DataSource,
    private readonly commissionsService: CommissionsService,
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  async create(payload: Partial<Sale>): Promise<Sale> {
    const sale = this.salesRepository.create(payload);
    return this.salesRepository.save(sale);
  }

  async findAll(filters: SalesFilterOptions) {
    return this.salesRepository.findPaginated(filters);
  }

  async findOne(id: number): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: [
        'client',
        'veterinarian',
        'items',
        'items.product',
        'items.procedure',
        'payments',
        'payments.paymentMethod',
      ],
    });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    return sale;
  }

  async update(id: number, payload: any): Promise<Sale> {
    const sale = await this.salesRepository.findOne({ where: { id } });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    Object.assign(sale, payload);
    return this.salesRepository.save(sale);
  }

  async remove(id: number): Promise<void> {
    const sale = await this.salesRepository.findOne({ where: { id } });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    await this.salesRepository.remove(sale);
  }

  async cancel(id: number): Promise<Sale> {
    return this.dataSource.transaction(async (manager) => {
      const saleRepository = manager.getRepository(Sale);

      const sale = await saleRepository
        .createQueryBuilder('sale')
        .setLock('pessimistic_write')
        .where('sale.id = :id', { id })
        .getOne();

      if (!sale) {
        throw new NotFoundException(`Sale with ID ${id} not found`);
      }

      if (sale.status === 'CANCELED') {
        throw new ConflictException(`Venda #${sale.id} ja esta cancelada.`);
      }

      if (sale.status === 'PAID') {
        await this.stockMovementsService.reverseSaleMovements({
          manager,
          saleId: sale.id,
          occurredAt: new Date(),
          referenceType: 'SALE_CANCELLATION',
          notes: `Estorno de estoque pelo cancelamento da venda #${sale.id}`,
        });
      }

      sale.status = 'CANCELED';
      return saleRepository.save(sale);
    });
  }

  async undoCheckout(id: number): Promise<Sale> {
    return this.dataSource.transaction(async (manager) => {
      const saleRepository = manager.getRepository(Sale);
      const paymentsRepository = manager.getRepository(Payment);
      const accountsReceivableRepository =
        manager.getRepository(AccountReceivable);

      const sale = await saleRepository
        .createQueryBuilder('sale')
        .setLock('pessimistic_write')
        .where('sale.id = :id', { id })
        .getOne();

      if (!sale) {
        throw new NotFoundException(`Sale with ID ${id} not found`);
      }

      if (sale.status !== 'PAID') {
        throw new ConflictException(
          `Apenas vendas pagas podem ter pagamento estornado.`,
        );
      }

      await paymentsRepository.delete({ saleId: sale.id });
      await accountsReceivableRepository.delete({ saleId: sale.id });
      await this.stockMovementsService.reverseSaleMovements({
        manager,
        saleId: sale.id,
        occurredAt: new Date(),
        referenceType: 'SALE_CHECKOUT_UNDO',
        notes: `Estorno de estoque pela reabertura da venda #${sale.id}`,
      });

      sale.status = 'OPEN';
      return saleRepository.save(sale);
    });
  }

  async checkout(
    id: number,
    payload: CheckoutSaleDto,
  ): Promise<CheckoutSaleResponseDto> {
    const paidAt = new Date(payload.paidAt);
    if (Number.isNaN(paidAt.getTime())) {
      throw new BadRequestException('paidAt invalido');
    }

    const requestedAmount = this.normalizeMoney(payload.amount);

    return this.dataSource.transaction(async (manager) => {
      const saleRepository = manager.getRepository(Sale);
      const paymentsRepository = manager.getRepository(Payment);
      const paymentMethodsRepository = manager.getRepository(PaymentMethod);
      const accountsReceivableRepository =
        manager.getRepository(AccountReceivable);

      const sale = await saleRepository
        .createQueryBuilder('sale')
        .setLock('pessimistic_write')
        .where('sale.id = :id', { id })
        .getOne();

      if (!sale) {
        throw new NotFoundException(`Sale with ID ${id} not found`);
      }

      if (sale.status !== 'OPEN') {
        throw new ConflictException(`Venda #${sale.id} ja foi liquidada.`);
      }

      const paymentMethod = await paymentMethodsRepository.findOne({
        where: { id: payload.paymentMethodId },
      });

      if (!paymentMethod || !paymentMethod.isActive) {
        throw new BadRequestException(
          `Forma de pagamento ${payload.paymentMethodId} inexistente ou inativa.`,
        );
      }

      const totalAmount = this.normalizeMoney(sale.totalAmount);
      if (requestedAmount !== totalAmount) {
        throw new BadRequestException(
          `Checkout da venda #${sale.id} exige pagamento integral de ${totalAmount.toFixed(2)}.`,
        );
      }

      const existingPayment = await paymentsRepository.findOne({
        where: { saleId: sale.id },
      });
      if (existingPayment) {
        throw new ConflictException(`Venda #${sale.id} ja foi liquidada.`);
      }

      const existingReceivable = await accountsReceivableRepository.findOne({
        where: { saleId: sale.id },
      });
      if (existingReceivable) {
        throw new ConflictException(`Venda #${sale.id} ja foi liquidada.`);
      }

      try {
        const payment = paymentsRepository.create({
          saleId: sale.id,
          paymentMethodId: payload.paymentMethodId,
          amount: requestedAmount,
          paidAt,
          notes: payload.notes,
        });

        const savedPayment = await paymentsRepository.save(payment);
        const dueDateObj = new Date(paidAt);
        // Force the time to midnight for consistency with a DATE column
        dueDateObj.setUTCHours(0, 0, 0, 0);

        const accountReceivable = accountsReceivableRepository.create({
          saleId: sale.id,
          clientId: sale.clientId ?? null,
          paymentMethodId: payload.paymentMethodId,
          description: `Recebimento da venda #${sale.id}`,
          dueDate: dueDateObj,
          paidAt,
          amount: requestedAmount,
          paidAmount: requestedAmount,
          status: 'PAID',
          originType: 'SALE',
          notes: payload.notes,
        });

        const savedAccountReceivable =
          await accountsReceivableRepository.save(accountReceivable);

        sale.status = 'PAID';
        await saleRepository.save(sale);
        await this.createStockMovementsForSale(manager, sale.id, paidAt);
        await this.commissionsService.calculateForPaidSale(
          manager,
          sale,
          paidAt,
        );

        return {
          saleId: sale.id,
          saleStatus: sale.status,
          paymentId: savedPayment.id,
          accountReceivableId: savedAccountReceivable.id,
          paymentMethodId: payload.paymentMethodId,
          amount: requestedAmount,
          paidAt: paidAt.toISOString(),
          dueDate: dueDateObj.toISOString().slice(0, 10),
          description: accountReceivable.description,
        };
      } catch (error) {
        if (this.isAccountsReceivableSaleDuplicate(error)) {
          throw new ConflictException(`Venda #${sale.id} ja foi liquidada.`);
        }
        throw error;
      }
    });
  }

  private normalizeMoney(value: number | string): number {
    const parsed = Number(value);
    return Math.round((parsed + Number.EPSILON) * 100) / 100;
  }

  private async createStockMovementsForSale(
    manager: any,
    saleId: number,
    occurredAt: Date,
  ) {
    const items = await manager.getRepository(SaleItem).find({
      where: { saleId },
      relations: ['product'],
    });

    const defaultLocation = await this.stockMovementsService.ensureSaleItemsHaveStock(
      manager,
      items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      })),
    );

    const groupedItems = new Map<number, number>();
    for (const item of items) {
      if (!item.productId || !item.product?.trackStock || item.product?.isService) {
        continue;
      }

      groupedItems.set(
        item.productId,
        Number((groupedItems.get(item.productId) || 0) + Number(item.quantity)),
      );
    }

    for (const [productId, quantity] of groupedItems.entries()) {
      await this.stockMovementsService.createStockOut(manager, {
        productId,
        stockLocationId: defaultLocation.id,
        quantity,
        referenceType: 'SALE',
        referenceId: saleId,
        occurredAt,
        notes: `Baixa automatica da venda #${saleId}`,
        reason: 'Venda',
      });
    }
  }

  private isAccountsReceivableSaleDuplicate(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const dbError = (error as any).driverError;
    return (
      dbError?.code === '23505' &&
      String(dbError?.detail || '').includes('(sale_id)')
    );
  }
}
