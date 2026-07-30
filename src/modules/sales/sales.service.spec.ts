import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { SalesService } from './sales.service';
import { Sale } from './entities/sale.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { AccountReceivable } from '../accounts-receivable/entities/account-receivable.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { SaleItem } from '../sale-items/entities/sale-item.entity';

describe('SalesService - checkout', () => {
  const saleEntity = {
    id: 10,
    status: 'OPEN',
    totalAmount: 150.5,
    clientId: 7,
  } as Sale;

  const checkoutPayload = {
    paymentMethodId: 1,
    cashRegisterSessionId: 5,
    amount: 150.5,
    paidAt: '2026-03-02T18:30:00.000Z',
  };

  const createSut = () => {
    const checkoutQueryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    const saleRepository = {
      createQueryBuilder: jest.fn(() => checkoutQueryBuilder),
      save: jest.fn(),
    };

    const paymentsRepository = {
      findOne: jest.fn(),
      create: jest.fn((payload) => payload),
      save: jest.fn(),
    };

    const paymentMethodsRepository = {
      findBy: jest.fn(),
    };

    const accountsReceivableRepository = {
      findOne: jest.fn(),
      create: jest.fn((payload) => payload),
      save: jest.fn(),
    };

    const saleItemsRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Sale) return saleRepository;
        if (entity === Payment) return paymentsRepository;
        if (entity === PaymentMethod) return paymentMethodsRepository;
        if (entity === AccountReceivable) return accountsReceivableRepository;
        if (entity === SaleItem) return saleItemsRepository;
        throw new Error(`Unexpected repository request for ${entity}`);
      }),
    };

    const dataSource = {
      transaction: jest.fn((callback) => callback(manager)),
    };

    const commissionsService = {
      calculateForPaidSale: jest.fn().mockResolvedValue([]),
    };
    const stockMovementsService = {
      ensureSaleItemsHaveStock: jest.fn().mockResolvedValue(null),
      createStockOut: jest.fn().mockResolvedValue(null),
      reverseSaleMovements: jest.fn().mockResolvedValue(undefined),
    };
    const cashRegistersService = {
      registerSalePayment: jest.fn().mockResolvedValue(undefined),
      registerCheckoutUndo: jest.fn().mockResolvedValue(undefined),
    };

    const service = new SalesService(
      {} as any,
      dataSource as any,
      commissionsService as unknown as CommissionsService,
      stockMovementsService as any,
      cashRegistersService as any,
    );

    return {
      service,
      dataSource,
      commissionsService,
      checkoutQueryBuilder,
      saleRepository,
      paymentsRepository,
      paymentMethodsRepository,
      accountsReceivableRepository,
      saleItemsRepository,
      stockMovementsService,
      cashRegistersService,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should perform checkout atomically and return settlement data', async () => {
    const {
      service,
      checkoutQueryBuilder,
      saleRepository,
      paymentsRepository,
      paymentMethodsRepository,
      accountsReceivableRepository,
      commissionsService,
      cashRegistersService,
    } = createSut();

    checkoutQueryBuilder.getOne.mockResolvedValue({ ...saleEntity });
    paymentMethodsRepository.findBy.mockResolvedValue([
      {
        id: 1,
        isActive: true,
      },
    ]);
    paymentsRepository.findOne.mockResolvedValue(null);
    accountsReceivableRepository.findOne.mockResolvedValue(null);
    paymentsRepository.save.mockResolvedValue([
      {
        id: 300,
        saleId: saleEntity.id,
        paymentMethodId: 1,
        amount: 150.5,
      },
    ]);
    accountsReceivableRepository.save.mockResolvedValue({
      id: 900,
      saleId: saleEntity.id,
    });

    const result = await service.checkout(saleEntity.id, checkoutPayload, 99);

    expect(result).toEqual({
      saleId: 10,
      saleStatus: 'PAID',
      paymentId: 300,
      accountReceivableId: 900,
      paymentMethodId: 1,
      cashRegisterSessionId: 5,
      printReceiptAvailable: true,
      fiscalStatus: 'PENDING_ISSUE',
      amount: 150.5,
      paidAt: '2026-03-02T18:30:00.000Z',
      dueDate: '2026-03-02',
      description: 'Recebimento da venda #10',
    });

    expect(checkoutQueryBuilder.setLock).toHaveBeenCalledWith(
      'pessimistic_write',
    );
    expect(paymentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        saleId: 10,
        paymentMethodId: 1,
        cashRegisterSessionId: 5,
        amount: 150.5,
        tenderedAmount: 150.5,
        changeAmount: 0,
      }),
    );
    expect(accountsReceivableRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        saleId: 10,
        clientId: 7,
        paymentMethodId: 1,
        paidAmount: 150.5,
        status: 'PAID',
        originType: 'SALE',
        description: 'Recebimento da venda #10',
        dueDate: new Date('2026-03-02T00:00:00.000Z'),
      }),
    );
    expect(saleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 10,
        status: 'PAID',
        cashRegisterSessionId: 5,
      }),
    );
    expect(cashRegistersService.registerSalePayment).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        sessionId: 5,
        amount: 150.5,
        currentUserId: 99,
      }),
    );
    expect(commissionsService.calculateForPaidSale).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: 10,
        status: 'PAID',
      }),
      new Date('2026-03-02T18:30:00.000Z'),
    );
  });

  it('should throw NotFoundException when sale does not exist', async () => {
    const { service, checkoutQueryBuilder } = createSut();
    checkoutQueryBuilder.getOne.mockResolvedValue(null);

    await expect(
      service.checkout(999, checkoutPayload, 99),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw ConflictException when sale is not OPEN', async () => {
    const { service, checkoutQueryBuilder } = createSut();
    checkoutQueryBuilder.getOne.mockResolvedValue({
      ...saleEntity,
      status: 'PAID',
    });

    await expect(
      service.checkout(saleEntity.id, checkoutPayload, 99),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should throw BadRequestException when payment method is inactive', async () => {
    const { service, checkoutQueryBuilder, paymentMethodsRepository } =
      createSut();
    checkoutQueryBuilder.getOne.mockResolvedValue({ ...saleEntity });
    paymentMethodsRepository.findBy.mockResolvedValue([
      {
        id: 1,
        isActive: false,
      },
    ]);

    await expect(
      service.checkout(saleEntity.id, checkoutPayload, 99),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw BadRequestException when amount is not full', async () => {
    const { service, checkoutQueryBuilder, paymentMethodsRepository } =
      createSut();
    checkoutQueryBuilder.getOne.mockResolvedValue({ ...saleEntity });
    paymentMethodsRepository.findBy.mockResolvedValue([
      {
        id: 1,
        isActive: true,
      },
    ]);

    await expect(
      service.checkout(
        saleEntity.id,
        {
          ...checkoutPayload,
          amount: 149.99,
        },
        99,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should rollback transaction when intermediate persistence fails', async () => {
    const {
      service,
      checkoutQueryBuilder,
      paymentMethodsRepository,
      paymentsRepository,
      accountsReceivableRepository,
      saleRepository,
    } = createSut();

    checkoutQueryBuilder.getOne.mockResolvedValue({ ...saleEntity });
    paymentMethodsRepository.findBy.mockResolvedValue([
      {
        id: 1,
        isActive: true,
      },
    ]);
    paymentsRepository.findOne.mockResolvedValue(null);
    accountsReceivableRepository.findOne.mockResolvedValue(null);
    paymentsRepository.save.mockResolvedValue([
      { id: 300, paymentMethodId: 1, amount: 150.5 },
    ]);
    accountsReceivableRepository.save.mockRejectedValue(
      new Error('forced persistence failure'),
    );

    await expect(
      service.checkout(saleEntity.id, checkoutPayload, 99),
    ).rejects.toThrow('forced persistence failure');
    expect(saleRepository.save).not.toHaveBeenCalled();
  });

  it('should map unique violation on sale_id to business conflict', async () => {
    const {
      service,
      checkoutQueryBuilder,
      paymentMethodsRepository,
      paymentsRepository,
      accountsReceivableRepository,
    } = createSut();

    checkoutQueryBuilder.getOne.mockResolvedValue({ ...saleEntity });
    paymentMethodsRepository.findBy.mockResolvedValue([
      {
        id: 1,
        isActive: true,
      },
    ]);
    paymentsRepository.findOne.mockResolvedValue(null);
    accountsReceivableRepository.findOne.mockResolvedValue(null);
    paymentsRepository.save.mockResolvedValue([
      { id: 300, paymentMethodId: 1, amount: 150.5 },
    ]);
    accountsReceivableRepository.save.mockRejectedValue(
      new QueryFailedError('insert', [], {
        code: '23505',
        detail: 'Key (sale_id)=(10) already exists.',
      } as any),
    );

    await expect(
      service.checkout(saleEntity.id, checkoutPayload, 99),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
