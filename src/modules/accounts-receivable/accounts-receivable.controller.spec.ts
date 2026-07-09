import { Test, TestingModule } from '@nestjs/testing';
import { AccountsReceivableController } from './accounts-receivable.controller';
import { AccountsReceivableService } from './accounts-receivable.service';

describe('AccountsReceivableController', () => {
  let controller: AccountsReceivableController;

  const accountsReceivableServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    getDashboardMetrics: jest.fn(),
    markAsReceived: jest.fn(),
    undoReceive: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsReceivableController],
      providers: [
        {
          provide: AccountsReceivableService,
          useValue: accountsReceivableServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AccountsReceivableController>(
      AccountsReceivableController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should update account receivable', async () => {
    accountsReceivableServiceMock.update.mockResolvedValue({
      id: 1,
      description: 'Recebimento atualizado',
      clientId: 2,
    });

    const result = await controller.update(1, {
      description: 'Recebimento atualizado',
      clientId: 2,
    } as any);

    expect(result.clientId).toBe(2);
  });
});
