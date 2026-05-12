import { CommissionsService } from './commissions.service';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sale-items/entities/sale-item.entity';
import { Commission } from './entities/commission.entity';

describe('CommissionsService', () => {
  const sale = {
    id: 15,
    veterinarianId: 9,
  } as Sale;

  const calculatedAt = new Date('2026-03-02T18:30:00.000Z');

  const createSut = (
    saleItems: Partial<SaleItem>[],
    existingCommission?: Partial<Commission>,
  ) => {
    const saleItemsRepository = {
      find: jest.fn().mockResolvedValue(saleItems),
    };

    const commissionsRepository = {
      findOne: jest.fn().mockResolvedValue(existingCommission || null),
      create: jest.fn((payload) => payload),
      save: jest.fn(async (payload) => ({ id: 1, ...payload })),
    };

    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === SaleItem) return saleItemsRepository;
        if (entity === Commission) return commissionsRepository;
        throw new Error(`Unexpected repository ${entity}`);
      }),
    };

    const service = new CommissionsService({} as any);

    return {
      service,
      manager: manager as any,
      saleItemsRepository,
      commissionsRepository,
    };
  };

  it('should calculate commission from sale procedure items', async () => {
    const { service, manager, commissionsRepository } = createSut([
      {
        saleId: 15,
        procedureId: 5,
        totalPrice: 150,
        procedure: {
          id: 5,
          commissionPercent: 20,
        } as any,
      },
    ]);

    const result = await service.calculateForPaidSale(
      manager,
      sale,
      calculatedAt,
    );

    expect(result).toEqual([
      expect.objectContaining({
        saleId: 15,
        procedureId: 5,
        userId: 9,
        amount: 30,
        baseAmount: 150,
        ratePercent: 20,
        status: 'PENDING',
      }),
    ]);
    expect(commissionsRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should skip procedures with zero commission rate', async () => {
    const { service, manager, commissionsRepository } = createSut([
      {
        saleId: 15,
        procedureId: 5,
        totalPrice: 150,
        procedure: {
          id: 5,
          commissionPercent: 0,
        } as any,
      },
    ]);

    const result = await service.calculateForPaidSale(
      manager,
      sale,
      calculatedAt,
    );

    expect(result).toEqual([]);
    expect(commissionsRepository.save).not.toHaveBeenCalled();
  });

  it('should be idempotent for the same sale and procedure', async () => {
    const { service, manager, commissionsRepository } = createSut(
      [
        {
          saleId: 15,
          procedureId: 5,
          totalPrice: 150,
          procedure: {
            id: 5,
            commissionPercent: 10,
          } as any,
        },
      ],
      { id: 99, saleId: 15, procedureId: 5 } as Commission,
    );

    const result = await service.calculateForPaidSale(
      manager,
      sale,
      calculatedAt,
    );

    expect(result).toEqual([]);
    expect(commissionsRepository.findOne).toHaveBeenCalledWith({
      where: {
        saleId: 15,
        procedureId: 5,
      },
    });
    expect(commissionsRepository.save).not.toHaveBeenCalled();
  });
});
