import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, In, QueryFailedError } from 'typeorm';
import {
  SalesFilterOptions,
  SalesRepository,
} from './repositories/sales.repository';
import { Sale } from './entities/sale.entity';
import { CheckoutSaleDto } from './dto/checkout-sale.dto';
import { CheckoutSaleResponseDto } from './dto/checkout-sale-response.dto';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { AccountReceivable } from '../accounts-receivable/entities/account-receivable.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { SaleItem } from '../sale-items/entities/sale-item.entity';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { Consultation } from '../consultations/entities/consultation.entity';
import { ConsultationProcedure } from '../consultation-procedures/entities/consultation-procedure.entity';
import { Procedure } from '../procedures/entities/procedure.entity';
import { CashRegistersService } from '../cash-registers/cash-registers.service';

type ConsultationSaleSource = Pick<
  Consultation,
  'id' | 'clientId' | 'veterinarianId' | 'appointmentId' | 'visitDate'
> & {
  finalizedAt?: Date | null;
};

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly dataSource: DataSource,
    private readonly commissionsService: CommissionsService,
    private readonly stockMovementsService: StockMovementsService,
    private readonly cashRegistersService: CashRegistersService,
  ) {}

  async create(payload: Partial<Sale>, currentUserId: number): Promise<Sale> {
    if (!currentUserId || Number.isNaN(currentUserId)) {
      throw new BadRequestException(
        'Usuário autenticado inválido para criar venda.',
      );
    }

    const sale = this.salesRepository.create({
      ...payload,
      veterinarianId: currentUserId,
      saleDate: new Date(),
    });
    return this.salesRepository.save(sale);
  }

  async findAll(filters: SalesFilterOptions) {
    return this.salesRepository.findPaginated(filters);
  }

  async findOne(id: number): Promise<Sale> {
    const sale = await this.loadSaleWithDetails(
      this.salesRepository.manager as EntityManager,
      id,
    );

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
    const { veterinarianId, saleDate, ...allowedPayload } = payload || {};
    void veterinarianId;
    void saleDate;
    Object.assign(sale, allowedPayload);
    return this.salesRepository.save(sale);
  }

  async remove(id: number): Promise<void> {
    const sale = await this.salesRepository.findOne({ where: { id } });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    await this.salesRepository.remove(sale);
  }

  async createOrSyncFromConsultation(
    manager: EntityManager,
    consultation: ConsultationSaleSource,
  ): Promise<Sale> {
    const consultationProceduresRepository = manager.getRepository(
      ConsultationProcedure,
    );
    const saleRepository = manager.getRepository(Sale);
    const saleItemsRepository = manager.getRepository(SaleItem);

    const consultationProcedures = await consultationProceduresRepository.find({
      where: { consultationId: consultation.id },
      order: { id: 'ASC' },
    });

    const billableProcedures = consultationProcedures.filter((item) => {
      const quantity = Number(item.quantity || 0);
      const totalPrice = this.normalizeMoney(item.totalPrice || 0);
      return quantity > 0 && totalPrice > 0;
    });

    const existingSale = await saleRepository
      .createQueryBuilder('sale')
      .setLock('pessimistic_write')
      .where('sale.consultationId = :consultationId', {
        consultationId: consultation.id,
      })
      .andWhere('sale.status IN (:...statuses)', {
        statuses: ['OPEN', 'PAID'],
      })
      .orderBy(`CASE WHEN sale.status = 'OPEN' THEN 0 ELSE 1 END`, 'ASC')
      .addOrderBy('sale.id', 'DESC')
      .getOne();

    if (existingSale?.status === 'PAID') {
      return (
        (await this.loadSaleWithDetails(manager, existingSale.id)) ||
        existingSale
      );
    }

    if (!billableProcedures.length) {
      throw new BadRequestException(
        'Adicione ao menos um procedimento cobrável antes de finalizar e cobrar.',
      );
    }

    const sale =
      existingSale ||
      saleRepository.create({
        consultationId: consultation.id,
        appointmentId: consultation.appointmentId ?? null,
        status: 'OPEN',
      });

    sale.clientId = consultation.clientId ?? null;
    sale.veterinarianId = consultation.veterinarianId;
    sale.consultationId = consultation.id;
    sale.appointmentId = consultation.appointmentId ?? null;
    sale.saleDate =
      consultation.finalizedAt ||
      consultation.visitDate ||
      sale.saleDate ||
      new Date();
    sale.discountAmount = this.normalizeMoney(sale.discountAmount || 0);

    const savedSale = await saleRepository.save(sale);

    await saleItemsRepository.delete({
      saleId: savedSale.id,
      originType: 'CONSULTATION_PROCEDURE',
    });

    const generatedItems = billableProcedures.map((item) =>
      saleItemsRepository.create({
        saleId: savedSale.id,
        procedureId: item.procedureId,
        quantity: Number(item.quantity || 0),
        unitPrice: this.normalizeMoney(item.unitPrice || 0),
        discountAmount: 0,
        totalPrice: this.normalizeMoney(item.totalPrice || 0),
        originType: 'CONSULTATION_PROCEDURE',
        originReferenceId: item.id,
      }),
    );

    if (generatedItems.length) {
      await saleItemsRepository.save(generatedItems);
    }

    const allItems = await saleItemsRepository.find({
      where: { saleId: savedSale.id },
    });
    const subtotal = allItems.reduce(
      (sum, item) =>
        Number(sum) + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0,
    );
    const itemsTotal = allItems.reduce(
      (sum, item) => Number(sum) + Number(item.totalPrice || 0),
      0,
    );

    savedSale.subtotal = this.normalizeMoney(subtotal);
    savedSale.totalAmount = Math.max(
      0,
      this.normalizeMoney(itemsTotal - Number(savedSale.discountAmount || 0)),
    );

    await saleRepository.save(savedSale);

    return (await this.loadSaleWithDetails(manager, savedSale.id)) || savedSale;
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
        await this.commissionsService.handleSaleCheckoutReversal(
          manager,
          sale,
          new Date(),
          `Comissão cancelada pelo cancelamento da venda #${sale.id}.`,
        );
      }

      sale.status = 'CANCELED';
      return saleRepository.save(sale);
    });
  }

  async undoCheckout(id: number, currentUserId: number): Promise<Sale> {
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

      if (sale.status !== 'PAID') {
        throw new ConflictException(
          `Apenas vendas pagas podem ter pagamento estornado.`,
        );
      }

      const payment = await paymentsRepository.findOne({
        where: { saleId: sale.id },
      });
      const paymentMethod = payment
        ? await paymentMethodsRepository.findOne({
            where: { id: payment.paymentMethodId },
          })
        : null;

      if (sale.cashRegisterSessionId && payment) {
        await this.cashRegistersService.registerCheckoutUndo(manager, {
          sessionId: sale.cashRegisterSessionId,
          saleId: sale.id,
          payment,
          paymentMethod,
          occurredAt: new Date(),
          currentUserId,
        });
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
      await this.commissionsService.handleSaleCheckoutReversal(
        manager,
        sale,
        new Date(),
        `Comissão ajustada pela reabertura do checkout da venda #${sale.id}.`,
      );

      sale.status = 'OPEN';
      sale.cashRegisterSessionId = null;
      return saleRepository.save(sale);
    });
  }

  async checkout(
    id: number,
    payload: CheckoutSaleDto,
    currentUserId: number,
  ): Promise<CheckoutSaleResponseDto> {
    const paidAt = new Date(payload.paidAt);
    if (Number.isNaN(paidAt.getTime())) {
      throw new BadRequestException('paidAt invalido');
    }

    const checkoutPayments = (
      payload.payments?.length
        ? payload.payments
        : payload.paymentMethodId && payload.amount
          ? [
              {
                paymentMethodId: payload.paymentMethodId,
                amount: payload.amount,
              },
            ]
          : []
    ).map((payment) => ({
      paymentMethodId: Number(payment.paymentMethodId),
      amount: this.normalizeMoney(payment.amount),
      tenderedAmount: this.normalizeMoney(
        payment.tenderedAmount ?? payment.amount,
      ),
    }));

    if (!checkoutPayments.length) {
      throw new BadRequestException('Informe ao menos uma forma de pagamento.');
    }

    if (checkoutPayments.some((payment) => payment.amount <= 0)) {
      throw new BadRequestException(
        'Valores de pagamento devem ser maiores que zero.',
      );
    }

    if (
      checkoutPayments.some(
        (payment) => payment.tenderedAmount < payment.amount,
      )
    ) {
      throw new BadRequestException(
        'Valor recebido não pode ser menor que o valor pago.',
      );
    }

    const requestedAmount = this.normalizeMoney(
      checkoutPayments.reduce((sum, payment) => sum + payment.amount, 0),
    );

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

      const uniquePaymentMethodIds = [
        ...new Set(checkoutPayments.map((payment) => payment.paymentMethodId)),
      ];
      const paymentMethods = await paymentMethodsRepository.findBy({
        id: In(uniquePaymentMethodIds),
      });
      const paymentMethodById = new Map(
        paymentMethods
          .filter((method) => method.isActive)
          .map((method) => [Number(method.id), method]),
      );
      const invalidPaymentMethodId = uniquePaymentMethodIds.find(
        (paymentMethodId) => !paymentMethodById.has(paymentMethodId),
      );

      if (invalidPaymentMethodId) {
        throw new BadRequestException(
          `Forma de pagamento ${invalidPaymentMethodId} inexistente ou inativa.`,
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
        const savedPayments = await paymentsRepository.save(
          checkoutPayments.map((payment) =>
            paymentsRepository.create({
              saleId: sale.id,
              paymentMethodId: payment.paymentMethodId,
              cashRegisterSessionId: payload.cashRegisterSessionId,
              amount: payment.amount,
              tenderedAmount: payment.tenderedAmount,
              changeAmount: this.normalizeMoney(
                payment.tenderedAmount - payment.amount,
              ),
              paidAt,
              notes: payload.notes,
            }),
          ),
        );
        const primaryPayment = savedPayments[0];
        const primaryPaymentMethodId = checkoutPayments[0].paymentMethodId;
        const dueDateObj = new Date(paidAt);
        dueDateObj.setUTCHours(0, 0, 0, 0);

        const accountReceivable = accountsReceivableRepository.create({
          saleId: sale.id,
          clientId: sale.clientId ?? null,
          paymentMethodId: primaryPaymentMethodId,
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
        sale.cashRegisterSessionId = payload.cashRegisterSessionId;
        await saleRepository.save(sale);
        for (const savedPayment of savedPayments) {
          const paymentMethod = paymentMethodById.get(
            Number(savedPayment.paymentMethodId),
          );
          if (!paymentMethod) continue;
          await this.cashRegistersService.registerSalePayment(manager, {
            sessionId: payload.cashRegisterSessionId,
            sale,
            payment: savedPayment,
            paymentMethod,
            amount: Number(savedPayment.amount),
            paidAt,
            notes: payload.notes,
            currentUserId,
          });
        }
        await this.createStockMovementsForSale(manager, sale.id, paidAt);
        await this.commissionsService.calculateForPaidSale(
          manager,
          sale,
          paidAt,
        );

        return {
          saleId: sale.id,
          saleStatus: sale.status,
          paymentId: primaryPayment.id,
          accountReceivableId: savedAccountReceivable.id,
          paymentMethodId: primaryPaymentMethodId,
          cashRegisterSessionId: payload.cashRegisterSessionId,
          printReceiptAvailable: true,
          fiscalStatus: 'PENDING_ISSUE',
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
    manager: EntityManager,
    saleId: number,
    occurredAt: Date,
  ) {
    const items = await manager.getRepository(SaleItem).find({
      where: { saleId },
      relations: ['product', 'procedure'],
    });

    const stockRequests = await this.buildSaleStockRequests(manager, items);
    if (!stockRequests.length) {
      return;
    }

    const defaultLocation =
      await this.stockMovementsService.ensureSaleItemsHaveStock(
        manager,
        stockRequests,
      );

    const groupedItems = new Map<number, number>();
    for (const item of stockRequests) {
      if (!item.productId) {
        continue;
      }

      groupedItems.set(
        item.productId,
        Number(
          (groupedItems.get(item.productId) || 0) + Number(item.quantity || 0),
        ),
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

  private async buildSaleStockRequests(
    manager: EntityManager,
    items: SaleItem[],
  ): Promise<Array<{ productId?: number | null; quantity: number }>> {
    const requests: Array<{ productId?: number | null; quantity: number }> = [];
    const procedureIds = Array.from(
      new Set(
        items
          .map((item) => (item.procedureId ? Number(item.procedureId) : null))
          .filter((value): value is number => Boolean(value)),
      ),
    );

    const procedures = procedureIds.length
      ? await manager.getRepository(Procedure).find({
          where: procedureIds.map((id) => ({ id })),
        })
      : [];
    const proceduresMap = new Map(
      procedures.map((item) => [Number(item.id), item]),
    );

    for (const item of items) {
      if (item.productId) {
        requests.push({
          productId: item.productId,
          quantity: Number(item.quantity || 0),
        });
      }

      if (!item.procedureId) {
        continue;
      }

      const procedure = proceduresMap.get(Number(item.procedureId));
      const consumedProductId = procedure?.consumedProductId
        ? Number(procedure.consumedProductId)
        : null;
      const consumptionQuantity = Number(procedure?.consumptionQuantity || 0);

      if (!consumedProductId || consumptionQuantity <= 0) {
        continue;
      }

      requests.push({
        productId: consumedProductId,
        quantity: Number(item.quantity || 0) * consumptionQuantity,
      });
    }

    return requests.filter(
      (item) =>
        Number(item.productId || 0) > 0 && Number(item.quantity || 0) > 0,
    );
  }

  private async loadSaleWithDetails(
    manager: EntityManager,
    id: number,
  ): Promise<Sale | null> {
    return manager.getRepository(Sale).findOne({
      where: { id },
      relations: [
        'client',
        'veterinarian',
        'consultation',
        'appointment',
        'cashRegisterSession',
        'cashRegisterSession.terminal',
        'items',
        'items.product',
        'items.procedure',
        'payments',
        'payments.paymentMethod',
      ],
    });
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
