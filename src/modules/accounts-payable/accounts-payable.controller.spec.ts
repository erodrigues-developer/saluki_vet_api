import { Test, TestingModule } from '@nestjs/testing';
import { AccountsPayableController } from './accounts-payable.controller';
import { AccountsPayableService } from './accounts-payable.service';

describe('AccountsPayableController', () => {
  let controller: AccountsPayableController;

  const accountsPayableServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    getDashboardMetrics: jest.fn(),
    findAll: jest.fn(),
    markAsPaid: jest.fn(),
    undoPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsPayableController],
      providers: [
        {
          provide: AccountsPayableService,
          useValue: accountsPayableServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AccountsPayableController>(
      AccountsPayableController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should update account payable', async () => {
    accountsPayableServiceMock.update.mockResolvedValue({
      id: 1,
      description: 'Conta atualizada',
      supplierId: 2,
    });

    const result = await controller.update(1, {
      description: 'Conta atualizada',
      supplierId: 2,
    } as any);

    expect(result.supplierId).toBe(2);
  });
});
