import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { FileStorageService } from '../file-storage/file-storage.service';
import { ReportGeneration } from './entities/report-generation.entity';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ListReportHistoryDto } from './dto/list-report-history.dto';
import { AccountReceivable } from '../accounts-receivable/entities/account-receivable.entity';
import { AccountPayable } from '../accounts-payable/entities/account-payable.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';
import { StockBatch } from '../stock-batches/entities/stock-batch.entity';
import { User } from '../users/entities/user.entity';

type ReportType =
  | 'REVENUE_BY_PERIOD'
  | 'OPEN_ACCOUNTS_RECEIVABLE'
  | 'ACCOUNTS_PAYABLE_BY_DUE_DATE'
  | 'APPOINTMENTS_AND_CONSULTATIONS_BY_PERIOD'
  | 'STOCK_MOVEMENT_AND_POSITION';

type GenerateParams = {
  reportType: string;
  filters: GenerateReportDto;
  requestedByUserId: number;
  requestBaseUrl: string;
};

type WorkbookPayload = {
  workbook: ExcelJS.Workbook;
  rowCount: number;
  fileName: string;
};

@Injectable()
export class ReportsService {
  private readonly allowedTypes: ReportType[] = [
    'REVENUE_BY_PERIOD',
    'OPEN_ACCOUNTS_RECEIVABLE',
    'ACCOUNTS_PAYABLE_BY_DUE_DATE',
    'APPOINTMENTS_AND_CONSULTATIONS_BY_PERIOD',
    'STOCK_MOVEMENT_AND_POSITION',
  ];

  constructor(
    @InjectRepository(ReportGeneration)
    private readonly reportRepository: Repository<ReportGeneration>,
    @InjectRepository(AccountReceivable)
    private readonly receivableRepository: Repository<AccountReceivable>,
    @InjectRepository(AccountPayable)
    private readonly payableRepository: Repository<AccountPayable>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Consultation)
    private readonly consultationRepository: Repository<Consultation>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(StockBatch)
    private readonly stockBatchRepository: Repository<StockBatch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  getCatalog() {
    return {
      data: [
        {
          type: 'REVENUE_BY_PERIOD',
          label: 'Faturamento por período',
          description: 'Resumo e detalhamento de vendas e recebimentos.',
        },
        {
          type: 'OPEN_ACCOUNTS_RECEIVABLE',
          label: 'Contas a receber em aberto',
          description: 'Títulos pendentes, vencidos e por cliente.',
        },
        {
          type: 'ACCOUNTS_PAYABLE_BY_DUE_DATE',
          label: 'Contas a pagar por vencimento',
          description: 'Despesas ordenadas por vencimento e status.',
        },
        {
          type: 'APPOINTMENTS_AND_CONSULTATIONS_BY_PERIOD',
          label: 'Atendimentos e consultas por período',
          description: 'Agendamentos, consultas e resumo operacional.',
        },
        {
          type: 'STOCK_MOVEMENT_AND_POSITION',
          label: 'Movimentação e posição de estoque',
          description: 'Posição atual, lotes e histórico de movimentações.',
        },
      ],
    };
  }

  async generateReport(params: GenerateParams) {
    const reportType = this.normalizeReportType(params.reportType);
    const requester = await this.userRepository.findOneBy({
      id: params.requestedByUserId,
    });

    if (!requester) {
      throw new NotFoundException('User not found');
    }

    const startedAt = Date.now();
    const workbookPayload = await this.buildWorkbook(reportType, params.filters);
    const buffer = Buffer.from(await workbookPayload.workbook.xlsx.writeBuffer());

    const uploaded = await this.fileStorageService.uploadBinaryFile(
      {
        buffer,
        originalname: workbookPayload.fileName,
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
      },
      {
        folder: 'reports',
        requestBaseUrl: params.requestBaseUrl,
        allowedMimeTypes: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        maxFileSizeBytes: 20 * 1024 * 1024,
        cacheControl: 'private, max-age=31536000',
      },
    );

    const generatedAt = new Date();
    const entity = this.reportRepository.create({
      reportType,
      requestedByUserId: requester.id,
      filtersJson: this.normalizeFilters(params.filters),
      fileUrl: uploaded.fileUrl,
      storageKey: uploaded.storageKey,
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      fileSize: uploaded.fileSize,
      status: 'GENERATED',
      rowCount: workbookPayload.rowCount,
      generatedAt,
      generationTimeMs: Date.now() - startedAt,
    });

    const saved = await this.reportRepository.save(entity);
    return this.findHistoryItem(saved.id, requester.id);
  }

  async listHistory(query: ListReportHistoryDto, currentUserId: number) {
    const qb = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.requestedByUser', 'requestedByUser')
      .orderBy('report.generatedAt', 'DESC')
      .addOrderBy('report.id', 'DESC');

    if (query.scope !== 'all') {
      qb.andWhere('report.requestedByUserId = :currentUserId', { currentUserId });
    }

    if (query.reportType) {
      qb.andWhere('report.reportType = :reportType', {
        reportType: this.normalizeReportType(query.reportType),
      });
    }

    if (query.search?.trim()) {
      qb.andWhere(
        '(report.originalName ILIKE :search OR requestedByUser.name ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    }

    if (query.startDate) {
      qb.andWhere('report.generatedAt >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      qb.andWhere('report.generatedAt <= :endDate', {
        endDate: query.endDate,
      });
    }

    const data = await qb.getMany();
    return { data };
  }

  async findHistoryItem(id: number, currentUserId: number) {
    const entity = await this.reportRepository.findOne({
      where: { id },
      relations: ['requestedByUser'],
    });

    if (!entity) {
      throw new NotFoundException('Report not found');
    }

    this.ensureCanAccess(entity, currentUserId);
    return entity;
  }

  async getDownloadInfo(id: number, currentUserId: number) {
    const entity = await this.findHistoryItem(id, currentUserId);
    return {
      id: entity.id,
      reportType: entity.reportType,
      fileUrl: entity.fileUrl,
      originalName: entity.originalName,
      mimeType: entity.mimeType,
      fileSize: Number(entity.fileSize || 0),
      generatedAt: entity.generatedAt,
    };
  }

  private async buildWorkbook(
    reportType: ReportType,
    filters: GenerateReportDto,
  ): Promise<WorkbookPayload> {
    switch (reportType) {
      case 'REVENUE_BY_PERIOD':
        return this.buildRevenueWorkbook(filters);
      case 'OPEN_ACCOUNTS_RECEIVABLE':
        return this.buildReceivablesWorkbook(filters);
      case 'ACCOUNTS_PAYABLE_BY_DUE_DATE':
        return this.buildPayablesWorkbook(filters);
      case 'APPOINTMENTS_AND_CONSULTATIONS_BY_PERIOD':
        return this.buildAppointmentsConsultationsWorkbook(filters);
      case 'STOCK_MOVEMENT_AND_POSITION':
        return this.buildStockWorkbook(filters);
      default:
        throw new BadRequestException('Unsupported report type');
    }
  }

  private async buildRevenueWorkbook(
    filters: GenerateReportDto,
  ): Promise<WorkbookPayload> {
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.client', 'client')
      .leftJoinAndSelect('sale.veterinarian', 'veterinarian')
      .leftJoinAndSelect('sale.payments', 'payments')
      .orderBy('sale.saleDate', 'DESC')
      .addOrderBy('sale.id', 'DESC');

    this.applyDateRange(qb, 'sale.saleDate', filters.startDate, filters.endDate);

    if (filters.status) {
      qb.andWhere('sale.status = :status', { status: filters.status });
    }
    if (filters.clientId) {
      qb.andWhere('sale.clientId = :clientId', {
        clientId: Number(filters.clientId),
      });
    }
    if (filters.veterinarianId) {
      qb.andWhere('sale.veterinarianId = :veterinarianId', {
        veterinarianId: Number(filters.veterinarianId),
      });
    }

    const sales = await qb.getMany();

    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet('Resumo');
    const detailsSheet = workbook.addWorksheet('Vendas');

    const totalAmount = sales.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0,
    );
    const receivedAmount = sales
      .filter((item) => item.status === 'PAID')
      .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
    const openAmount = sales
      .filter((item) => item.status === 'OPEN')
      .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

    this.fillSheet(summarySheet, ['Indicador', 'Valor'], [
      ['Quantidade de vendas', sales.length],
      ['Total faturado', totalAmount],
      ['Recebido', receivedAmount],
      ['Em aberto', openAmount],
      ['Cancelado', sales.filter((item) => item.status === 'CANCELED').length],
    ]);

    this.fillSheet(
      detailsSheet,
      [
        'ID',
        'Data da venda',
        'Status',
        'Cliente',
        'Veterinário',
        'Subtotal',
        'Desconto',
        'Total',
        'Pagamentos',
      ],
      sales.map((item) => [
        item.id,
        this.formatDateTime(item.saleDate),
        item.status,
        item.client?.name || 'Venda balcão',
        item.veterinarian?.name || '-',
        Number(item.subtotal || 0),
        Number(item.discountAmount || 0),
        Number(item.totalAmount || 0),
        item.payments?.length || 0,
      ]),
    );

    return {
      workbook,
      rowCount: sales.length,
      fileName: `relatorio-faturamento-${this.fileSuffix()}.xlsx`,
    };
  }

  private async buildReceivablesWorkbook(
    filters: GenerateReportDto,
  ): Promise<WorkbookPayload> {
    const qb = this.receivableRepository
      .createQueryBuilder('ar')
      .leftJoinAndSelect('ar.client', 'client')
      .leftJoinAndSelect('ar.sale', 'sale')
      .leftJoinAndSelect('ar.paymentMethod', 'paymentMethod')
      .orderBy('ar.dueDate', 'ASC')
      .addOrderBy('ar.id', 'DESC');

    qb.andWhere('ar.status = :status', {
      status: filters.status && filters.status !== 'OVERDUE' ? filters.status : 'PENDING',
    });

    if (filters.status === 'OVERDUE') {
      qb.andWhere('ar.dueDate < CURRENT_DATE');
    }
    if (filters.clientId) {
      qb.andWhere('ar.clientId = :clientId', {
        clientId: Number(filters.clientId),
      });
    }
    if (filters.originType) {
      qb.andWhere('ar.originType = :originType', {
        originType: filters.originType,
      });
    }
    this.applyDateRange(qb, 'ar.dueDate', filters.startDate, filters.endDate);

    const rows = await qb.getMany();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Contas a receber');

    this.fillSheet(
      sheet,
      [
        'ID',
        'Descrição',
        'Cliente',
        'Origem',
        'Venda',
        'Vencimento',
        'Valor',
        'Status',
        'Atrasada',
      ],
      rows.map((item) => [
        item.id,
        item.description,
        item.client?.name || 'Sem cliente',
        item.originType,
        item.saleId || '-',
        this.formatDate(item.dueDate),
        Number(item.amount || 0),
        item.status,
        item.status === 'PENDING' && this.isPastDate(item.dueDate) ? 'Sim' : 'Não',
      ]),
    );

    return {
      workbook,
      rowCount: rows.length,
      fileName: `relatorio-contas-receber-${this.fileSuffix()}.xlsx`,
    };
  }

  private async buildPayablesWorkbook(
    filters: GenerateReportDto,
  ): Promise<WorkbookPayload> {
    const qb = this.payableRepository
      .createQueryBuilder('ap')
      .leftJoinAndSelect('ap.supplier', 'supplier')
      .leftJoinAndSelect('ap.beneficiaryUser', 'beneficiaryUser')
      .leftJoinAndSelect('ap.paymentMethodRelation', 'paymentMethodRelation')
      .orderBy('ap.dueDate', 'ASC')
      .addOrderBy('ap.id', 'DESC');

    if (filters.status && filters.status !== 'ALL') {
      if (filters.status === 'OVERDUE') {
        qb.andWhere('ap.status = :pendingStatus', { pendingStatus: 'PENDING' });
        qb.andWhere('ap.dueDate < CURRENT_DATE');
      } else {
        qb.andWhere('ap.status = :status', { status: filters.status });
      }
    }
    if (filters.category) {
      qb.andWhere('ap.category = :category', { category: filters.category });
    }
    if (filters.supplierId) {
      qb.andWhere('ap.supplierId = :supplierId', {
        supplierId: Number(filters.supplierId),
      });
    }
    this.applyDateRange(qb, 'ap.dueDate', filters.startDate, filters.endDate);

    const rows = await qb.getMany();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Contas a pagar');

    this.fillSheet(
      sheet,
      [
        'ID',
        'Descrição',
        'Categoria',
        'Fornecedor/Beneficiário',
        'Origem',
        'Vencimento',
        'Valor',
        'Pago em',
        'Status',
      ],
      rows.map((item) => [
        item.id,
        item.description,
        item.category || 'Sem categoria',
        item.supplier?.name || item.beneficiaryUser?.name || '-',
        item.originType,
        this.formatDate(item.dueDate),
        Number(item.amount || 0),
        this.formatDateTime(item.paidAt),
        item.status,
      ]),
    );

    return {
      workbook,
      rowCount: rows.length,
      fileName: `relatorio-contas-pagar-${this.fileSuffix()}.xlsx`,
    };
  }

  private async buildAppointmentsConsultationsWorkbook(
    filters: GenerateReportDto,
  ): Promise<WorkbookPayload> {
    const appointmentsQuery = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.appointmentType', 'appointmentType')
      .leftJoinAndSelect('appointment.status', 'status')
      .leftJoinAndSelect('appointment.checkedInByUser', 'checkedInByUser')
      .orderBy('appointment.startsAt', 'DESC')
      .addOrderBy('appointment.id', 'DESC');

    this.applyDateRange(
      appointmentsQuery,
      'appointment.startsAt',
      filters.startDate,
      filters.endDate,
    );

    if (filters.veterinarianId) {
      appointmentsQuery.andWhere('appointment.veterinarianId = :veterinarianId', {
        veterinarianId: Number(filters.veterinarianId),
      });
    }
    if (filters.appointmentStatusCode) {
      appointmentsQuery.andWhere('status.code = :statusCode', {
        statusCode: filters.appointmentStatusCode,
      });
    }
    if (filters.appointmentTypeId) {
      appointmentsQuery.andWhere('appointment.appointmentTypeId = :appointmentTypeId', {
        appointmentTypeId: Number(filters.appointmentTypeId),
      });
    }

    const consultationsQuery = this.consultationRepository
      .createQueryBuilder('consultation')
      .orderBy('consultation.visitDate', 'DESC')
      .addOrderBy('consultation.id', 'DESC');

    this.applyDateRange(
      consultationsQuery,
      'consultation.visitDate',
      filters.startDate,
      filters.endDate,
    );

    if (filters.veterinarianId) {
      consultationsQuery.andWhere('consultation.veterinarianId = :veterinarianId', {
        veterinarianId: Number(filters.veterinarianId),
      });
    }

    const [appointments, consultations] = await Promise.all([
      appointmentsQuery.getMany(),
      consultationsQuery.getMany(),
    ]);

    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet('Resumo');
    const appointmentsSheet = workbook.addWorksheet('Agendamentos');
    const consultationsSheet = workbook.addWorksheet('Consultas');

    this.fillSheet(summarySheet, ['Indicador', 'Valor'], [
      ['Agendamentos no período', appointments.length],
      ['Consultas no período', consultations.length],
      [
        'Consultas finalizadas',
        consultations.filter((item) => item.recordStatus === 'FINALIZED').length,
      ],
      [
        'Agendamentos com check-in',
        appointments.filter((item) => Boolean(item.arrivedAt)).length,
      ],
    ]);

    this.fillSheet(
      appointmentsSheet,
      [
        'ID',
        'Início',
        'Fim',
        'Tipo',
        'Status',
        'Veterinário ID',
        'Risco triagem',
        'Check-in',
      ],
      appointments.map((item) => [
        item.id,
        this.formatDateTime(item.startsAt),
        this.formatDateTime(item.endsAt),
        item.appointmentType?.name || '-',
        item.status?.code || '-',
        item.veterinarianId || '-',
        item.triageRisk || '-',
        this.formatDateTime(item.arrivedAt),
      ]),
    );

    this.fillSheet(
      consultationsSheet,
      [
        'ID',
        'Data da consulta',
        'Pet ID',
        'Cliente ID',
        'Veterinário ID',
        'Status do prontuário',
        'Finalizada em',
        'Diagnóstico',
      ],
      consultations.map((item) => [
        item.id,
        this.formatDateTime(item.visitDate),
        item.petId,
        item.clientId,
        item.veterinarianId,
        item.recordStatus,
        this.formatDateTime(item.finalizedAt),
        item.diagnosis || '-',
      ]),
    );

    return {
      workbook,
      rowCount: appointments.length + consultations.length,
      fileName: `relatorio-atendimentos-consultas-${this.fileSuffix()}.xlsx`,
    };
  }

  private async buildStockWorkbook(
    filters: GenerateReportDto,
  ): Promise<WorkbookPayload> {
    const movementsQuery = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('product.productCategory', 'productCategory')
      .leftJoinAndSelect('movement.stockLocation', 'stockLocation')
      .leftJoinAndSelect('movement.stockBatch', 'stockBatch')
      .leftJoinAndSelect('movement.createdByUser', 'createdByUser')
      .orderBy('movement.occurredAt', 'DESC')
      .addOrderBy('movement.id', 'DESC');

    this.applyDateRange(
      movementsQuery,
      'movement.occurredAt',
      filters.startDate,
      filters.endDate,
    );

    if (filters.productId) {
      movementsQuery.andWhere('movement.productId = :productId', {
        productId: Number(filters.productId),
      });
    }
    if (filters.stockLocationId) {
      movementsQuery.andWhere('movement.stockLocationId = :stockLocationId', {
        stockLocationId: Number(filters.stockLocationId),
      });
    }
    if (filters.productCategoryId) {
      movementsQuery.andWhere('product.productCategoryId = :productCategoryId', {
        productCategoryId: Number(filters.productCategoryId),
      });
    }
    if (filters.movementType) {
      movementsQuery.andWhere('movement.movementType = :movementType', {
        movementType: filters.movementType,
      });
    }
    if (filters.referenceType) {
      movementsQuery.andWhere('movement.referenceType = :referenceType', {
        referenceType: filters.referenceType,
      });
    }

    const positionsQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productCategory', 'productCategory')
      .where('product.trackStock = :trackStock', { trackStock: true })
      .andWhere('product.isService = :isService', { isService: false })
      .orderBy('product.name', 'ASC');

    if (filters.productId) {
      positionsQuery.andWhere('product.id = :productId', {
        productId: Number(filters.productId),
      });
    }
    if (filters.productCategoryId) {
      positionsQuery.andWhere('product.productCategoryId = :productCategoryId', {
        productCategoryId: Number(filters.productCategoryId),
      });
    }

    const [movements, products] = await Promise.all([
      movementsQuery.getMany(),
      positionsQuery.getMany(),
    ]);

    const movementRows = this.filterMovementRowsByExpirationStatus(
      movements,
      filters.expirationStatus,
    );
    const positionRows = await this.buildStockPositionRows(
      products,
      filters.stockLocationId ? Number(filters.stockLocationId) : undefined,
      filters.expirationStatus,
    );

    const workbook = new ExcelJS.Workbook();
    const positionSheet = workbook.addWorksheet('Posição');
    const movementsSheet = workbook.addWorksheet('Movimentações');

    this.fillSheet(
      positionSheet,
      [
        'Produto',
        'Categoria',
        'Saldo atual',
        'Estoque mínimo',
        'Menor validade',
        'Lotes ativos',
      ],
      positionRows.map((item) => [
        item.productName,
        item.categoryName,
        item.currentStock,
        item.minimumStock,
        item.nextExpirationDate || '-',
        item.activeLots,
      ]),
    );

    this.fillSheet(
      movementsSheet,
      [
        'ID',
        'Data/hora',
        'Produto',
        'Categoria',
        'Local',
        'Tipo',
        'Quantidade',
        'Lote',
        'Validade',
        'Referência',
        'Usuário',
      ],
      movementRows.map((item) => [
        item.id,
        this.formatDateTime(item.occurredAt),
        item.product?.name || '-',
        item.product?.productCategory?.name || 'Sem categoria',
        item.stockLocation?.name || '-',
        item.movementType,
        Number(item.quantity || 0),
        item.stockBatch?.lotCode || '-',
        item.stockBatch?.expirationDate || '-',
        item.referenceType || '-',
        item.createdByUser?.name || '-',
      ]),
    );

    return {
      workbook,
      rowCount: positionRows.length + movementRows.length,
      fileName: `relatorio-estoque-${this.fileSuffix()}.xlsx`,
    };
  }

  private async buildStockPositionRows(
    products: Product[],
    stockLocationId?: number,
    expirationStatus?: string,
  ) {
    const rows: Array<{
      productName: string;
      categoryName: string;
      currentStock: number;
      minimumStock: number;
      nextExpirationDate: string | null;
      activeLots: number;
    }> = [];

    for (const product of products) {
      const balanceQuery = this.stockMovementRepository
        .createQueryBuilder('movement')
        .select(
          `COALESCE(SUM(CASE
            WHEN movement.movementType IN ('IN', 'ADJUSTMENT_IN') THEN movement.quantity
            WHEN movement.movementType IN ('OUT', 'ADJUSTMENT_OUT') THEN -movement.quantity
            ELSE 0
          END), 0)`,
          'quantity',
        )
        .where('movement.productId = :productId', { productId: product.id });

      if (stockLocationId) {
        balanceQuery.andWhere('movement.stockLocationId = :stockLocationId', {
          stockLocationId,
        });
      }

      const batchesQuery = this.stockBatchRepository
        .createQueryBuilder('batch')
        .where('batch.productId = :productId', { productId: product.id })
        .andWhere('batch.remainingQuantity > 0');

      if (stockLocationId) {
        batchesQuery.andWhere('batch.stockLocationId = :stockLocationId', {
          stockLocationId,
        });
      }

      const [balanceRaw, batches] = await Promise.all([
        balanceQuery.getRawOne<{ quantity: string }>(),
        batchesQuery.orderBy('batch.expirationDate', 'ASC').getMany(),
      ]);

      const filteredBatches = expirationStatus
        ? batches.filter(
            (item) =>
              this.getExpirationStatus(item.expirationDate) === expirationStatus,
          )
        : batches;

      if (expirationStatus && !filteredBatches.length) {
        continue;
      }

      rows.push({
        productName: product.name,
        categoryName: product.productCategory?.name || 'Sem categoria',
        currentStock: Number(balanceRaw?.quantity || 0),
        minimumStock: Number(product.minimumStock || 0),
        nextExpirationDate: filteredBatches[0]?.expirationDate || batches[0]?.expirationDate || null,
        activeLots: filteredBatches.length || batches.length,
      });
    }

    return rows;
  }

  private filterMovementRowsByExpirationStatus(
    rows: StockMovement[],
    expirationStatus?: string,
  ) {
    if (!expirationStatus) {
      return rows;
    }

    return rows.filter(
      (item) =>
        this.getExpirationStatus(item.stockBatch?.expirationDate || null) ===
        expirationStatus,
    );
  }

  private fillSheet(
    sheet: ExcelJS.Worksheet,
    headers: string[],
    rows: Array<Array<string | number | null>>,
  ) {
    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE9F2EA' },
    };

    rows.forEach((row) => sheet.addRow(row));

    sheet.columns = headers.map((header, index) => ({
      header,
      key: header,
      width: Math.max(
        18,
        ...[header.length, ...rows.map((row) => String(row[index] ?? '').length)],
      ),
    }));
  }

  private applyDateRange<T>(
    qb: SelectQueryBuilder<T>,
    field: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (startDate) {
      qb.andWhere(`${field} >= :startDate`, { startDate });
    }
    if (endDate) {
      qb.andWhere(`${field} <= :endDate`, { endDate });
    }
  }

  private normalizeReportType(value: string): ReportType {
    const normalized = String(value || '').trim().toUpperCase() as ReportType;
    if (!this.allowedTypes.includes(normalized)) {
      throw new BadRequestException('Invalid report type');
    }
    return normalized;
  }

  private normalizeFilters(filters: GenerateReportDto) {
    return Object.fromEntries(
      Object.entries(filters || {}).filter(([, value]) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && !value.trim()) return false;
        return true;
      }),
    );
  }

  private ensureCanAccess(entity: ReportGeneration, currentUserId: number) {
    void entity;
    void currentUserId;
  }

  private fileSuffix() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  private formatDate(value?: string | Date | null) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  private formatDateTime(value?: string | Date | null) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }

  private isPastDate(value?: string | Date | null) {
    if (!value) return false;
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return date.getTime() < now.getTime();
  }

  private getExpirationStatus(value?: string | null) {
    if (!value) return 'NONE';
    const target = new Date(value);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 30) return 'EXPIRING';
    return 'VALID';
  }
}
