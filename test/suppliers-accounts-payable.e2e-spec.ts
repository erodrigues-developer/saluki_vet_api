import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { SuppliersController } from '../src/modules/suppliers/suppliers.controller';
import { SuppliersService } from '../src/modules/suppliers/suppliers.service';
import { AccountsPayableController } from '../src/modules/accounts-payable/accounts-payable.controller';
import { AccountsPayableService } from '../src/modules/accounts-payable/accounts-payable.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('Suppliers + AccountsPayable contract (e2e)', () => {
  let app: INestApplication;

  const suppliers: Array<{ id: number; name: string; isActive: boolean }> = [];
  const accounts: Array<{ id: number; supplierId: number }> = [];
  let supplierIdSequence = 1;
  let accountIdSequence = 1;

  const suppliersServiceMock = {
    create: jest.fn(async (dto: any) => {
      const supplier = {
        id: supplierIdSequence++,
        name: dto.name,
        isActive: dto.isActive ?? true,
      };

      suppliers.push(supplier);
      return supplier;
    }),
    findAll: jest.fn(async (query: any) => {
      const search = query?.search?.toLowerCase();
      const isActiveFilter = query?.isActive;

      const data = suppliers.filter((supplier) => {
        if (
          typeof isActiveFilter === 'boolean' &&
          supplier.isActive !== isActiveFilter
        ) {
          return false;
        }

        if (!search) {
          return true;
        }

        return supplier.name.toLowerCase().includes(search);
      });

      return {
        data,
        meta: {
          total: data.length,
          page: 1,
          limit: 20,
        },
      };
    }),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const accountsPayableServiceMock = {
    create: jest.fn(async (dto: any) => {
      const supplier = suppliers.find(
        (item) => item.id === Number(dto.supplierId),
      );

      const account = {
        id: accountIdSequence++,
        ...dto,
        supplierId: Number(dto.supplierId),
        supplier: supplier || null,
        status: 'PENDING',
      };

      accounts.push({ id: account.id, supplierId: account.supplierId });
      return account;
    }),
    update: jest.fn(),
    getDashboardMetrics: jest.fn(),
    findAll: jest.fn(),
    markAsPaid: jest.fn(),
    undoPayment: jest.fn(),
  };

  beforeAll(async () => {
    jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockReturnValue(true as any);
    jest
      .spyOn(RolesGuard.prototype, 'canActivate')
      .mockReturnValue(true as any);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController, AccountsPayableController],
      providers: [
        {
          provide: SuppliersService,
          useValue: suppliersServiceMock,
        },
        {
          provide: AccountsPayableService,
          useValue: accountsPayableServiceMock,
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
    await app.close();
  });

  it('should create supplier and account payable with supplierId', async () => {
    const supplierResponse = await request(app.getHttpServer())
      .post('/api/v1/suppliers')
      .send({
        name: 'Zoetis',
        isActive: true,
      })
      .expect(201);

    const createdSupplierId = supplierResponse.body.id;

    expect(createdSupplierId).toBeDefined();

    const payableResponse = await request(app.getHttpServer())
      .post('/api/v1/accounts-payable')
      .send({
        description: 'Compra de insumos',
        supplierId: createdSupplierId,
        category: 'Fornecedores',
        amount: 250,
        dueDate: '2026-03-20',
      })
      .expect(201);

    expect(payableResponse.body.supplierId).toBe(createdSupplierId);
    expect(payableResponse.body.status).toBe('PENDING');
  });

  it('should reject accounts-payable payload using deprecated supplierName', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/accounts-payable')
      .send({
        description: 'Conta inválida',
        supplierId: 1,
        supplierName: 'Texto Livre',
        amount: 100,
        dueDate: '2026-03-21',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'property supplierName should not exist',
    );
  });
});
