import { Test, TestingModule } from '@nestjs/testing';
import { AccountsPayableService } from './accounts-payable.service';
import { AccountPayable } from './entities/account-payable.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { User } from '../users/entities/user.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { CommissionsService } from '../commissions/commissions.service';

describe('AccountsPayableService', () => {
  let service: AccountsPayableService;
  let repository: Repository<AccountPayable>;
  let suppliersRepository: Repository<Supplier>;
  let usersRepository: Repository<User>;
  let paymentMethodsRepository: Repository<PaymentMethod>;

  const mockDate = new Date('2024-07-15T12:00:00Z');

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        amount: '150.50',
        dueDate: new Date('2024-07-15'),
        status: 'PENDING',
        category: 'Custos Fixos',
        supplierId: 1,
        supplier: { id: 1, name: 'Zoetis' },
      },
      {
        id: 2,
        amount: '200.00',
        dueDate: new Date('2024-07-10'),
        status: 'PAID',
        paidAmount: '200.00',
        paidAt: mockDate,
        category: 'Folha de Pagamento',
        supplierId: 2,
        supplier: { id: 2, name: 'Elanco' },
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
    findOneBy: jest.fn(),
    merge: jest.fn().mockImplementation((entity, payload) => ({
      ...entity,
      ...payload,
    })),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockSuppliersRepository = {
    findOneBy: jest.fn(),
  };

  const mockUsersRepository = {
    findOneBy: jest.fn(),
  };

  const mockPaymentMethodsRepository = {
    findOne: jest.fn(),
  };

  const mockCommissionsService = {
    markPayoutAsPaidByAccountPayable: jest.fn(),
    reopenPayoutByAccountPayable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsPayableService,
        {
          provide: getRepositoryToken(AccountPayable),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockSuppliersRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: mockPaymentMethodsRepository,
        },
        {
          provide: CommissionsService,
          useValue: mockCommissionsService,
        },
      ],
    }).compile();

    service = module.get<AccountsPayableService>(AccountsPayableService);
    repository = module.get<Repository<AccountPayable>>(
      getRepositoryToken(AccountPayable),
    );
    suppliersRepository = module.get<Repository<Supplier>>(
      getRepositoryToken(Supplier),
    );
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
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

  describe('create', () => {
    it('should create a new account payable with status PENDING', async () => {
      const dto = {
        description: 'Conta de Energia',
        supplierId: 1,
        amount: 150.5,
        dueDate: new Date('2024-07-20'),
      };

      mockSuppliersRepository.findOneBy.mockResolvedValueOnce({
        id: 1,
        name: 'Zoetis',
      });

      const result = await service.create(dto as any);

      expect(suppliersRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        status: 'PENDING',
        originType: 'MANUAL',
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toEqual('PENDING');
      expect(result.id).toEqual(1);
    });

    it('should throw NotFoundException when supplier does not exist', async () => {
      mockSuppliersRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(
        service.create({
          description: 'Conta',
          supplierId: 999,
          amount: 100,
          dueDate: new Date(),
        } as any),
      ).rejects.toThrow('Supplier not found');
    });
  });

  describe('update', () => {
    it('should update account payable with new supplierId', async () => {
      const mockAccount = {
        id: 1,
        description: 'Conta antiga',
        supplierId: 1,
      } as any;

      mockRepository.findOneBy.mockResolvedValueOnce(mockAccount);
      mockSuppliersRepository.findOneBy.mockResolvedValueOnce({
        id: 2,
        name: 'Elanco',
      });

      const result = await service.update(1, {
        description: 'Conta atualizada',
        supplierId: 2,
      } as any);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockSuppliersRepository.findOneBy).toHaveBeenCalledWith({ id: 2 });
      expect(mockRepository.merge).toHaveBeenCalledWith(mockAccount, {
        description: 'Conta atualizada',
        supplierId: 2,
      });
      expect(result.description).toBe('Conta atualizada');
      expect(result.supplierId).toBe(2);
    });
  });

  describe('markAsPaid', () => {
    it('should mark an account as PAID and save payment details', async () => {
      const mockAccount = {
        id: 1,
        status: 'PENDING',
        amount: 150.5,
      };

      mockRepository.findOneBy.mockResolvedValueOnce(mockAccount);

      const dto = {
        paidAt: new Date('2024-07-15T12:00:00Z'),
        paidAmount: 150.5,
        paymentMethod: 'PIX',
      };

      await service.markAsPaid(1, dto);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockAccount,
        status: 'PAID',
        paidAt: new Date(dto.paidAt),
        paidAmount: dto.paidAmount,
        paymentMethodId: null,
        paymentMethod: dto.paymentMethod,
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      const dto = {
        paidAt: new Date(),
        paidAmount: 150,
        paymentMethod: 'PIX',
      };

      await expect(service.markAsPaid(999, dto)).rejects.toThrow(
        'Account not found',
      );
    });
  });

  describe('undoPayment', () => {
    it('should revert account status to PENDING and clear payment details', async () => {
      const mockAccount = {
        id: 1,
        status: 'PAID',
        paidAt: new Date(),
        paidAmount: 150.5,
        paymentMethod: 'PIX',
      };

      mockRepository.findOneBy.mockResolvedValueOnce(mockAccount);

      await service.undoPayment(1);

      expect(repository.save).toHaveBeenCalledWith({
        ...mockAccount,
        status: 'PENDING',
        paidAt: null,
        paidAmount: null,
        paymentMethodId: null,
        paymentMethod: null,
      });
    });
  });

  describe('getDashboardMetrics', () => {
    it('should calculate KPIs and chart data correctly', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-07-12'));

      const result = await service.getDashboardMetrics(7, 2024);

      expect(result.data.kpis).toEqual(
        expect.objectContaining({
          totalPending: 150.5,
          totalPaid: 200,
          totalOverdue: 0,
          expectedTotal: 350.5,
        }),
      );

      expect(result.data.charts.categoryPie).toEqual(
        expect.arrayContaining([
          { name: 'Custos Fixos', value: 150.5 },
          { name: 'Folha de Pagamento', value: 200 },
        ]),
      );

      jest.useRealTimers();
    });
  });
});
