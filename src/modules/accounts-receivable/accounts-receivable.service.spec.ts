import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountsReceivableService } from './accounts-receivable.service';
import { AccountReceivable } from './entities/account-receivable.entity';
import { Client } from '../clients/entities/client.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';

describe('AccountsReceivableService', () => {
  let service: AccountsReceivableService;
  let repository: Repository<AccountReceivable>;
  let clientsRepository: Repository<Client>;
  let paymentMethodsRepository: Repository<PaymentMethod>;

  const mockDate = new Date('2024-07-15T12:00:00Z');

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        amount: '250.00',
        dueDate: new Date('2024-07-20'),
        status: 'PENDING',
        originType: 'MANUAL',
      },
      {
        id: 2,
        amount: '100.00',
        paidAmount: '100.00',
        dueDate: new Date('2024-07-10'),
        status: 'PAID',
        originType: 'SALE',
      },
    ]),
  };

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) =>
      Promise.resolve({
        id: 1,
        ...entity,
        createdAt: mockDate,
        updatedAt: mockDate,
      }),
    ),
    merge: jest.fn().mockImplementation((entity, ...sources) =>
      Object.assign({}, entity, ...sources),
    ),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockClientsRepository = {
    findOneBy: jest.fn(),
  };

  const mockPaymentMethodsRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsReceivableService,
        {
          provide: getRepositoryToken(AccountReceivable),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: mockClientsRepository,
        },
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: mockPaymentMethodsRepository,
        },
      ],
    }).compile();

    service = module.get<AccountsReceivableService>(AccountsReceivableService);
    repository = module.get<Repository<AccountReceivable>>(
      getRepositoryToken(AccountReceivable),
    );
    clientsRepository = module.get<Repository<Client>>(getRepositoryToken(Client));
    paymentMethodsRepository = module.get<Repository<PaymentMethod>>(
      getRepositoryToken(PaymentMethod),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a manual account receivable with status PENDING', async () => {
    mockClientsRepository.findOneBy.mockResolvedValueOnce({
      id: 1,
      name: 'Maria',
    });

    const result = await service.create({
      description: 'Banho e tosa pendente',
      clientId: 1,
      amount: 250,
      dueDate: new Date('2024-07-20'),
    } as any);

    expect(clientsRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Banho e tosa pendente',
        status: 'PENDING',
        originType: 'MANUAL',
      }),
    );
    expect(result.status).toBe('PENDING');
    expect(result.originType).toBe('MANUAL');
  });

  it('should mark manual receivable as received', async () => {
    mockRepository.findOne.mockResolvedValueOnce({
      id: 1,
      status: 'PENDING',
      originType: 'MANUAL',
      saleId: null,
      amount: 250,
      notes: null,
    });
    mockPaymentMethodsRepository.findOneBy.mockResolvedValueOnce({
      id: 5,
      isActive: true,
    });

    await service.markAsReceived(1, {
      paidAt: new Date('2024-07-15T14:00:00Z'),
      paidAmount: 250,
      paymentMethodId: 5,
      note: 'Recebido no balcão',
    } as any);

    expect(paymentMethodsRepository.findOneBy).toHaveBeenCalledWith({ id: 5 });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PAID',
        paymentMethodId: 5,
        paidAmount: 250,
      }),
    );
  });

  it('should block receiving sale-origin receivables', async () => {
    mockRepository.findOne.mockResolvedValueOnce({
      id: 2,
      status: 'PAID',
      originType: 'SALE',
      saleId: 10,
    });

    await expect(
      service.markAsReceived(2, {
        paidAt: new Date(),
        paidAmount: 100,
        paymentMethodId: 1,
      } as any),
    ).rejects.toThrow(
      'Receivables generated from sales must be managed through the sales flow.',
    );
  });

  it('should calculate dashboard metrics', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-07-12T12:00:00Z'));

    const result = await service.getDashboardMetrics({});

    expect(result.data.kpis).toEqual(
      expect.objectContaining({
        totalPending: 250,
        totalPaid: 100,
        totalOverdue: 0,
        expectedTotal: 350,
      }),
    );

    jest.useRealTimers();
  });
});
