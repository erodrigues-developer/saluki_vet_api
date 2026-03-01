import { Test, TestingModule } from '@nestjs/testing';
import { AccountsPayableController } from './accounts-payable.controller';
import { AccountsPayableService } from './accounts-payable.service';

describe('AccountsPayableController', () => {
  let controller: AccountsPayableController;

  const accountsPayableServiceMock = {
    create: jest.fn(),
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
});
