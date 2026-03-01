import { Test, TestingModule } from '@nestjs/testing';
import { AccountsPayableService } from './accounts-payable.service';
import { AccountPayable } from './entities/account-payable.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('AccountsPayableService', () => {
  let service: AccountsPayableService;
  let repository: Repository<AccountPayable>;

  const mockDate = new Date('2024-07-15T12:00:00Z');

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
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          amount: '150.50',
          dueDate: new Date('2024-07-15'),
          status: 'PENDING',
          category: 'Custos Fixos',
        },
        {
          id: 2,
          amount: '200.00',
          dueDate: new Date('2024-07-10'),
          status: 'PAID',
          paidAmount: '200.00',
          paidAt: mockDate,
          category: 'Folha de Pagamento',
        },
      ]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsPayableService,
        {
          provide: getRepositoryToken(AccountPayable),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AccountsPayableService>(AccountsPayableService);
    repository = module.get<Repository<AccountPayable>>(
      getRepositoryToken(AccountPayable),
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
        amount: 150.5,
        dueDate: new Date('2024-07-20'),
      };

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        status: 'PENDING',
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toEqual('PENDING');
      expect(result.id).toEqual(1);
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

      const result = await service.markAsPaid(1, dto);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockAccount,
        status: 'PAID',
        paidAt: dto.paidAt,
        paidAmount: dto.paidAmount,
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
          totalPending: 150.5, // 2024-07-15 is after 2024-07-12
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
