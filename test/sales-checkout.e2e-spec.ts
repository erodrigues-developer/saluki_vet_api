import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
  VersioningType,
  HttpStatus,
} from '@nestjs/common';
import * as request from 'supertest';
import { QueryFailedError } from 'typeorm';
import { SalesController } from '../src/modules/sales/sales.controller';
import { SalesService } from '../src/modules/sales/sales.service';
import { Sale } from '../src/modules/sales/entities/sale.entity';
import { Payment } from '../src/modules/payments/entities/payment.entity';
import { PaymentMethod } from '../src/modules/payment-methods/entities/payment-method.entity';
import { AccountReceivable } from '../src/modules/accounts-receivable/entities/account-receivable.entity';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { getDataSourceToken } from '@nestjs/typeorm';
import { SalesRepository } from '../src/modules/sales/repositories/sales.repository';
import { SaleItem } from '../src/modules/sale-items/entities/sale-item.entity';
import { Procedure } from '../src/modules/procedures/entities/procedure.entity';
import { Commission } from '../src/modules/commissions/entities/commission.entity';
import { CommissionsService } from '../src/modules/commissions/commissions.service';
import { CommissionsRepository } from '../src/modules/commissions/repositories/commissions.repository';
import { StockMovementsService } from '../src/modules/stock-movements/stock-movements.service';

// Note: Reusing the same in-memory logic that simulates atomic DB capabilities,
// but now wrapped properly around HTTP supertest to evaluate pipeline, guards and pipes.

type InMemorySale = {
  id: number;
  status: string;
  totalAmount: number;
  clientId: number | null;
  veterinarianId?: number;
};

type InMemoryPayment = {
  id: number;
  saleId: number;
  paymentMethodId: number;
  amount: number;
  paidAt: Date;
};

type InMemoryPaymentMethod = {
  id: number;
  isActive: boolean;
};

type InMemoryAccountReceivable = {
  id: number;
  saleId: number | null;
  clientId: number | null;
  paymentMethodId?: number | null;
  description: string;
  amount: number;
  paidAmount?: number | null;
  dueDate: string | Date;
  paidAt: Date | null;
  status: string;
  originType?: string;
  notes?: string | null;
};

type InMemorySaleItem = {
  id: number;
  saleId: number;
  productId: number | null;
  procedureId: number | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
};

type InMemoryProcedure = {
  id: number;
  commissionPercent: number;
};

type InMemoryCommission = {
  id: number;
  userId: number;
  saleId: number | null;
  procedureId: number | null;
  amount: number;
  baseAmount: number | null;
  ratePercent: number | null;
  calculatedAt: Date;
  status: string;
};

type InMemoryState = {
  sales: InMemorySale[];
  payments: InMemoryPayment[];
  paymentMethods: InMemoryPaymentMethod[];
  accountsReceivable: InMemoryAccountReceivable[];
  saleItems: InMemorySaleItem[];
  procedures: InMemoryProcedure[];
  commissions: InMemoryCommission[];
};

class InMemoryCheckoutDataSource {
  private state: InMemoryState;
  private paymentSequence = 100;
  private accountSequence = 500;
  private commissionSequence = 800;
  private isLocked = false;
  private queueResolvers: Array<() => void> = [];
  private failAccountSaveBySaleId = new Set<number>();

  constructor(initial: InMemoryState) {
    this.state = this.cloneState(initial);
  }

  getSnapshot(): InMemoryState {
    return this.cloneState(this.state);
  }

  setFailAccountSaveForSale(saleId: number): void {
    this.failAccountSaveBySaleId.add(saleId);
  }

  async transaction<T>(
    callback: (manager: { getRepository: (entity: any) => any }) => Promise<T>,
  ): Promise<T> {
    await this.acquireGlobalLock();
    const txState = this.cloneState(this.state);

    try {
      const manager = this.createManager(txState);
      const result = await callback(manager);
      this.state = txState;
      return result;
    } finally {
      this.releaseGlobalLock();
    }
  }

  private async acquireGlobalLock(): Promise<void> {
    if (!this.isLocked) {
      this.isLocked = true;
      return;
    }

    await new Promise<void>((resolve) => {
      this.queueResolvers.push(resolve);
    });
    this.isLocked = true;
  }

  private releaseGlobalLock(): void {
    this.isLocked = false;
    const next = this.queueResolvers.shift();
    if (next) {
      next();
    }
  }

  private createManager(txState: InMemoryState) {
    const saleRepository = {
      createQueryBuilder: () => {
        let targetId = 0;

        const qb = {
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn((_query: string, params: { id: number }) => {
            targetId = Number(params.id);
            return qb;
          }),
          getOne: async () => {
            const sale = txState.sales.find((item) => item.id === targetId);
            return sale ? ({ ...sale } as any) : null;
          },
        };

        return qb;
      },
      save: async (sale: InMemorySale) => {
        const index = txState.sales.findIndex((item) => item.id === sale.id);
        txState.sales[index] = { ...sale };
        return { ...sale };
      },
    };

    const paymentsRepository = {
      findOne: async (params: { where: { saleId: number } }) => {
        const payment = txState.payments.find(
          (item) => item.saleId === params.where.saleId,
        );
        return payment ? ({ ...payment } as any) : null;
      },
      create: (payload: Omit<InMemoryPayment, 'id'>) => ({ ...payload }),
      save: async (payload: Omit<InMemoryPayment, 'id'>) => {
        const saved = { id: this.paymentSequence++, ...payload };
        txState.payments.push(saved);
        return { ...saved } as any;
      },
    };

    const paymentMethodsRepository = {
      findOne: async (params: { where: { id: number } }) => {
        const method = txState.paymentMethods.find(
          (item) => item.id === params.where.id,
        );
        return method ? ({ ...method } as any) : null;
      },
    };

    const accountsReceivableRepository = {
      findOne: async (params: { where: { saleId: number } }) => {
        const receivable = txState.accountsReceivable.find(
          (item) => item.saleId === params.where.saleId,
        );
        return receivable ? ({ ...receivable } as any) : null;
      },
      create: (payload: Omit<InMemoryAccountReceivable, 'id'>) => ({
        ...payload,
      }),
      save: async (payload: Omit<InMemoryAccountReceivable, 'id'>) => {
        if (
          payload.saleId &&
          this.failAccountSaveBySaleId.has(payload.saleId)
        ) {
          this.failAccountSaveBySaleId.delete(payload.saleId);
          throw new Error('forced account receivable failure');
        }

        if (
          payload.saleId &&
          txState.accountsReceivable.some(
            (item) => item.saleId === payload.saleId,
          )
        ) {
          throw new QueryFailedError('insert', [], {
            code: '23505',
            detail: `Key (sale_id)=(${payload.saleId}) already exists.`,
          } as any);
        }

        const saved = { id: this.accountSequence++, ...payload };
        txState.accountsReceivable.push(saved);
        return { ...saved } as any;
      },
    };

    const saleItemsRepository = {
      find: async (params: { where: { saleId: number } }) => {
        return txState.saleItems
          .filter((item) => item.saleId === params.where.saleId)
          .map((item) => ({
            ...item,
            procedure:
              item.procedureId !== null
                ? txState.procedures.find(
                    (procedure) => procedure.id === item.procedureId,
                  ) || null
                : null,
          })) as any;
      },
    };

    const commissionsRepository = {
      findOne: async (params: {
        where: { saleId: number; procedureId: number };
      }) => {
        const commission = txState.commissions.find(
          (item) =>
            item.saleId === params.where.saleId &&
            item.procedureId === params.where.procedureId,
        );
        return commission ? ({ ...commission } as any) : null;
      },
      create: (payload: Omit<InMemoryCommission, 'id'>) => ({ ...payload }),
      save: async (payload: Omit<InMemoryCommission, 'id'>) => {
        const saved = { id: this.commissionSequence++, ...payload };
        txState.commissions.push(saved);
        return { ...saved } as any;
      },
    };

    return {
      getRepository: (entity: any) => {
        if (entity === Sale) return saleRepository;
        if (entity === Payment) return paymentsRepository;
        if (entity === PaymentMethod) return paymentMethodsRepository;
        if (entity === AccountReceivable) return accountsReceivableRepository;
        if (entity === SaleItem) return saleItemsRepository;
        if (entity === Commission) return commissionsRepository;
        throw new Error(`Repository not implemented for ${entity}`);
      },
    };
  }

  private cloneState(state: InMemoryState): InMemoryState {
    return JSON.parse(JSON.stringify(state));
  }
}

describe('Sales checkout (e2e integration)', () => {
  let app: INestApplication;
  let dataSource: InMemoryCheckoutDataSource;

  const createPayload = (amount: number) => ({
    paymentMethodId: 1,
    amount,
    paidAt: '2026-03-02T18:30:00.000Z',
  });

  beforeEach(async () => {
    dataSource = new InMemoryCheckoutDataSource({
      sales: [
        {
          id: 1,
          status: 'OPEN',
          totalAmount: 150.5,
          clientId: 7,
          veterinarianId: 3,
        } as any,
        {
          id: 2,
          status: 'OPEN',
          totalAmount: 200,
          clientId: null,
          veterinarianId: 4,
        } as any,
        { id: 3, status: 'OPEN', totalAmount: 90, clientId: 4 },
        { id: 4, status: 'OPEN', totalAmount: 99, clientId: 5 },
      ],
      payments: [],
      paymentMethods: [
        { id: 1, isActive: true },
        { id: 2, isActive: false },
      ],
      accountsReceivable: [],
      saleItems: [
        {
          id: 1,
          saleId: 1,
          productId: null,
          procedureId: 11,
          quantity: 1,
          unitPrice: 150.5,
          discountAmount: 0,
          totalPrice: 150.5,
        },
      ],
      procedures: [{ id: 11, commissionPercent: 15 }],
      commissions: [],
    });

    jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockReturnValue(true as any);
    jest
      .spyOn(RolesGuard.prototype, 'canActivate')
      .mockReturnValue(true as any);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        SalesService,
        CommissionsService,
        {
          provide: StockMovementsService,
          useValue: {
            createStockOut: jest.fn(),
          },
        },
        {
          provide: SalesRepository,
          useValue: {},
        },
        {
          provide: CommissionsRepository,
          useValue: {},
        },
        {
          provide: getDataSourceToken(),
          useValue: dataSource,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api', {
      exclude: [
        { path: '', method: RequestMethod.GET },
        { path: '/', method: RequestMethod.GET },
      ],
    });
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    await app.init();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app?.close();
  });

  it('should honor endpoint contract and return checkout payload 201 via HTTP', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/sales/1/checkout')
      .send(createPayload(150.5))
      .expect(HttpStatus.CREATED);

    expect(res.body).toEqual(
      expect.objectContaining({
        saleId: 1,
        saleStatus: 'PAID',
        paymentMethodId: 1,
        amount: 150.5,
        dueDate: '2026-03-02',
        description: 'Recebimento da venda #1',
      }),
    );
    expect(res.body).toHaveProperty('paymentId');
    expect(res.body).toHaveProperty('accountReceivableId');
    expect(dataSource.getSnapshot().commissions).toEqual([
      expect.objectContaining({
        saleId: 1,
        procedureId: 11,
        userId: 3,
        amount: 22.58,
        baseAmount: 150.5,
        ratePercent: 15,
        status: 'PENDING',
      }),
    ]);
  });

  it('should reject forbidden saleId in payload contract via HTTP 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/sales/1/checkout')
      .send({
        ...createPayload(150.5),
        saleId: 1,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body.message).toEqual(
      expect.arrayContaining(['property saleId should not exist']),
    );
  });

  it('should not allow duplicated checkout for already settled sale via HTTP 409', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/sales/2/checkout')
      .send(createPayload(200))
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .post('/api/v1/sales/2/checkout')
      .send(createPayload(200))
      .expect(HttpStatus.CONFLICT);
  });

  it('should keep only one successful checkout under concurrent HTTP requests', async () => {
    const server = app.getHttpServer();
    const [first, second] = await Promise.allSettled([
      request(server).post('/api/v1/sales/4/checkout').send(createPayload(99)),
      request(server).post('/api/v1/sales/4/checkout').send(createPayload(99)),
    ]);

    const fulfilledResults = [first, second]
      .filter((result) => result.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<request.Response>).value.status);

    expect(fulfilledResults).toContain(HttpStatus.CREATED);
    expect(fulfilledResults).toContain(HttpStatus.CONFLICT);

    const snapshot = dataSource.getSnapshot();
    expect(snapshot.payments.filter((item) => item.saleId === 4)).toHaveLength(
      1,
    );
    expect(
      snapshot.accountsReceivable.filter((item) => item.saleId === 4),
    ).toHaveLength(1);
  });

  it('should rollback partial writes when a transaction step fails HTTP 500', async () => {
    dataSource.setFailAccountSaveForSale(3);

    await request(app.getHttpServer())
      .post('/api/v1/sales/3/checkout')
      .send(createPayload(90))
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);

    const snapshot = dataSource.getSnapshot();
    expect(snapshot.sales.find((item) => item.id === 3)?.status).toBe('OPEN');
    expect(snapshot.payments.filter((item) => item.saleId === 3)).toHaveLength(
      0,
    );
    expect(
      snapshot.accountsReceivable.filter((item) => item.saleId === 3),
    ).toHaveLength(0);
  });
});
