import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ClinicSettings } from '../clinic-settings/entities/clinic-settings.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { Sale } from '../sales/entities/sale.entity';
import { CashRegisterMovement } from './entities/cash-register-movement.entity';
import { CashRegisterSession } from './entities/cash-register-session.entity';
import { CashRegisterTerminal } from './entities/cash-register-terminal.entity';
import { PrintJob } from './entities/print-job.entity';
import { ThermalPrinter } from './entities/thermal-printer.entity';
import { PrintReceiptPaymentDto } from './dto/cash-register.dto';

@Injectable()
export class CashRegistersService {
  constructor(
    @InjectRepository(CashRegisterTerminal)
    private readonly terminalsRepository: Repository<CashRegisterTerminal>,
    @InjectRepository(CashRegisterSession)
    private readonly sessionsRepository: Repository<CashRegisterSession>,
    @InjectRepository(CashRegisterMovement)
    private readonly movementsRepository: Repository<CashRegisterMovement>,
    @InjectRepository(ThermalPrinter)
    private readonly printersRepository: Repository<ThermalPrinter>,
    @InjectRepository(PrintJob)
    private readonly printJobsRepository: Repository<PrintJob>,
  ) {}

  async createTerminal(payload: any) {
    const terminal = this.terminalsRepository.create({
      name: this.requiredText(payload.name, 'Nome do terminal é obrigatório.'),
      code: this.normalizeCode(payload.code),
      description: this.optionalText(payload.description),
      defaultPrinterId: payload.defaultPrinterId || null,
      isActive: payload.isActive !== false,
    });

    if (!terminal.code) {
      throw new BadRequestException('Código do terminal é obrigatório.');
    }

    await this.ensureUniqueTerminalCode(terminal.code);
    if (terminal.defaultPrinterId) {
      await this.ensureActivePrinter(terminal.defaultPrinterId);
    }

    const saved = await this.terminalsRepository.save(terminal);
    return this.findTerminal(saved.id);
  }

  async findTerminals(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: string | boolean;
    activeOnly?: string;
  }) {
    if (params.activeOnly === 'true') {
      return this.terminalsRepository.find({
        where: { isActive: true },
        relations: ['defaultPrinter'],
        order: { name: 'ASC' },
      });
    }

    const page = Number(params.page || 1) || 1;
    const limit = Number(params.limit || 10) || 10;
    const qb = this.terminalsRepository
      .createQueryBuilder('terminal')
      .leftJoinAndSelect('terminal.defaultPrinter', 'defaultPrinter');

    if (params.search) {
      qb.andWhere(
        '(LOWER(terminal.name) LIKE LOWER(:search) OR LOWER(terminal.code) LIKE LOWER(:search))',
        { search: `%${String(params.search).trim()}%` },
      );
    }

    const isActive = this.parseBoolean(params.isActive);
    if (isActive !== undefined) {
      qb.andWhere('terminal.isActive = :isActive', { isActive });
    }

    qb.orderBy('terminal.isActive', 'DESC')
      .addOrderBy('terminal.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { page, limit, total, summary: await this.summary() },
    };
  }

  async findTerminal(id: number) {
    const terminal = await this.terminalsRepository.findOne({
      where: { id },
      relations: ['defaultPrinter'],
    });
    if (!terminal) {
      throw new NotFoundException(`Terminal ${id} não encontrado.`);
    }
    return terminal;
  }

  async openingSuggestion(terminalId: number) {
    const terminal = await this.findTerminal(terminalId);
    const lastClosedSession = await this.sessionsRepository.findOne({
      where: { terminalId: terminal.id, status: 'CLOSED' },
      order: { closedAt: 'DESC', id: 'DESC' },
    });

    const suggestedOpeningAmount = this.normalizeMoney(
      lastClosedSession?.expectedCashAmount ?? 0,
    );

    return {
      terminalId: terminal.id,
      suggestedOpeningAmount,
      sourceSessionId: lastClosedSession?.id ?? null,
      sourceClosedAt: lastClosedSession?.closedAt ?? null,
      hasPreviousClosedSession: Boolean(lastClosedSession),
    };
  }

  async updateTerminal(id: number, payload: any) {
    const terminal = await this.findTerminal(id);
    const nextCode =
      payload.code !== undefined
        ? this.normalizeCode(payload.code)
        : terminal.code;
    if (!nextCode) {
      throw new BadRequestException('Código do terminal é obrigatório.');
    }
    await this.ensureUniqueTerminalCode(nextCode, id);

    const nextPrinterId =
      payload.defaultPrinterId !== undefined
        ? payload.defaultPrinterId || null
        : terminal.defaultPrinterId;
    if (nextPrinterId) {
      await this.ensureActivePrinter(nextPrinterId);
    }

    Object.assign(terminal, {
      name:
        payload.name !== undefined
          ? this.requiredText(payload.name, 'Nome do terminal é obrigatório.')
          : terminal.name,
      code: nextCode,
      description:
        payload.description !== undefined
          ? this.optionalText(payload.description)
          : terminal.description,
      defaultPrinterId: nextPrinterId,
      isActive:
        payload.isActive !== undefined
          ? Boolean(payload.isActive)
          : terminal.isActive,
    });

    await this.terminalsRepository.save(terminal);
    return this.findTerminal(id);
  }

  async createPrinter(payload: any) {
    const printer = this.printersRepository.create({
      name: this.requiredText(
        payload.name,
        'Nome da impressora é obrigatório.',
      ),
      code: this.normalizeCode(payload.code),
      connectionType: payload.connectionType || 'BROWSER_PRINT',
      target: this.requiredText(
        payload.target || 'browser',
        'Destino é obrigatório.',
      ),
      paperWidthMm: Number(payload.paperWidthMm || 80),
      columns: Number(payload.columns || 48),
      supportsQrCode: payload.supportsQrCode !== false,
      isActive: payload.isActive !== false,
    });

    if (!printer.code) {
      throw new BadRequestException('Código da impressora é obrigatório.');
    }
    await this.ensureUniquePrinterCode(printer.code);
    return this.printersRepository.save(printer);
  }

  async findPrinters(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: string | boolean;
    activeOnly?: string;
  }) {
    if (params.activeOnly === 'true') {
      return this.printersRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    }

    const page = Number(params.page || 1) || 1;
    const limit = Number(params.limit || 10) || 10;
    const qb = this.printersRepository.createQueryBuilder('printer');

    if (params.search) {
      qb.andWhere(
        '(LOWER(printer.name) LIKE LOWER(:search) OR LOWER(printer.code) LIKE LOWER(:search))',
        { search: `%${String(params.search).trim()}%` },
      );
    }

    const isActive = this.parseBoolean(params.isActive);
    if (isActive !== undefined) {
      qb.andWhere('printer.isActive = :isActive', { isActive });
    }

    qb.orderBy('printer.isActive', 'DESC')
      .addOrderBy('printer.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total } };
  }

  async updatePrinter(id: number, payload: any) {
    const printer = await this.printersRepository.findOne({ where: { id } });
    if (!printer) {
      throw new NotFoundException(`Impressora ${id} não encontrada.`);
    }

    const nextCode =
      payload.code !== undefined
        ? this.normalizeCode(payload.code)
        : printer.code;
    if (!nextCode) {
      throw new BadRequestException('Código da impressora é obrigatório.');
    }
    await this.ensureUniquePrinterCode(nextCode, id);

    Object.assign(printer, {
      name:
        payload.name !== undefined
          ? this.requiredText(payload.name, 'Nome da impressora é obrigatório.')
          : printer.name,
      code: nextCode,
      connectionType: payload.connectionType || printer.connectionType,
      target:
        payload.target !== undefined
          ? this.requiredText(payload.target, 'Destino é obrigatório.')
          : printer.target,
      paperWidthMm:
        payload.paperWidthMm !== undefined
          ? Number(payload.paperWidthMm)
          : printer.paperWidthMm,
      columns:
        payload.columns !== undefined
          ? Number(payload.columns)
          : printer.columns,
      supportsQrCode:
        payload.supportsQrCode !== undefined
          ? Boolean(payload.supportsQrCode)
          : printer.supportsQrCode,
      isActive:
        payload.isActive !== undefined
          ? Boolean(payload.isActive)
          : printer.isActive,
    });

    return this.printersRepository.save(printer);
  }

  async openSession(payload: any, currentUserId: number) {
    const openedAt = payload.openedAt ? new Date(payload.openedAt) : new Date();
    if (Number.isNaN(openedAt.getTime())) {
      throw new BadRequestException('Data de abertura inválida.');
    }

    return this.sessionsRepository.manager.transaction(async (manager) => {
      const terminal = await manager
        .getRepository(CashRegisterTerminal)
        .createQueryBuilder('terminal')
        .setLock('pessimistic_write')
        .where('terminal.id = :id', { id: payload.terminalId })
        .getOne();

      if (!terminal || !terminal.isActive) {
        throw new BadRequestException('Terminal inexistente ou inativo.');
      }

      const operatorSession = await manager
        .getRepository(CashRegisterSession)
        .findOne({
          where: { openedByUserId: currentUserId, status: 'OPEN' },
          relations: ['terminal'],
        });
      if (operatorSession) {
        throw new ConflictException(
          `Você já possui um caixa aberto no terminal ${operatorSession.terminal?.name || `#${operatorSession.terminalId}`}. Encerre o caixa atual antes de abrir outro terminal.`,
        );
      }

      const existing = await manager
        .getRepository(CashRegisterSession)
        .findOne({
          where: { terminalId: terminal.id, status: 'OPEN' },
        });
      if (existing) {
        throw new ConflictException('Este terminal já possui caixa aberto.');
      }

      const openingAmount = this.normalizeMoney(payload.openingAmount || 0);
      const session = await manager.getRepository(CashRegisterSession).save(
        manager.getRepository(CashRegisterSession).create({
          terminalId: terminal.id,
          openedByUserId: currentUserId,
          status: 'OPEN',
          openedAt,
          openingAmount,
          expectedCashAmount: openingAmount,
          notes: this.optionalText(payload.notes),
        }),
      );

      await manager.getRepository(CashRegisterMovement).save(
        manager.getRepository(CashRegisterMovement).create({
          sessionId: session.id,
          terminalId: terminal.id,
          type: 'OPENING',
          direction: 'IN',
          amount: openingAmount,
          createdByUserId: currentUserId,
          occurredAt: openedAt,
          notes: 'Abertura de caixa',
        }),
      );

      return this.findSession(session.id, manager);
    });
  }

  async findSessions(params: {
    page?: number;
    limit?: number;
    status?: string;
    terminalId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Number(params.page || 1) || 1;
    const limit = Number(params.limit || 10) || 10;
    const qb = this.sessionsRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.terminal', 'terminal')
      .leftJoinAndSelect('session.openedByUser', 'openedByUser')
      .leftJoinAndSelect('session.closedByUser', 'closedByUser');

    if (params.status && params.status !== 'ALL') {
      qb.andWhere('session.status = :status', { status: params.status });
    }
    if (params.terminalId) {
      qb.andWhere('session.terminalId = :terminalId', {
        terminalId: params.terminalId,
      });
    }
    if (params.startDate) {
      qb.andWhere('session.openedAt >= :startDate', {
        startDate: params.startDate,
      });
    }
    if (params.endDate) {
      qb.andWhere('session.openedAt <= :endDate', { endDate: params.endDate });
    }

    qb.orderBy('session.openedAt', 'DESC')
      .addOrderBy('session.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { page, limit, total, summary: await this.summary() },
    };
  }

  async findCurrentSession(currentUserId: number, terminalId?: number) {
    const qb = this.sessionsRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.terminal', 'terminal')
      .leftJoinAndSelect('session.openedByUser', 'openedByUser')
      .where('session.status = :status', { status: 'OPEN' })
      .andWhere('session.openedByUserId = :currentUserId', { currentUserId });

    if (terminalId) {
      qb.andWhere('session.terminalId = :terminalId', { terminalId });
    }

    return qb.orderBy('session.openedAt', 'DESC').getMany();
  }

  async findSession(id: number, manager?: EntityManager) {
    const repository = manager
      ? manager.getRepository(CashRegisterSession)
      : this.sessionsRepository;
    const session = await repository.findOne({
      where: { id },
      relations: [
        'terminal',
        'terminal.defaultPrinter',
        'openedByUser',
        'closedByUser',
      ],
    });
    if (!session) {
      throw new NotFoundException(`Sessão de caixa ${id} não encontrada.`);
    }
    return session;
  }

  async sessionSummary(id: number) {
    const session = await this.findSession(id);
    const movements = await this.movementsRepository.find({
      where: { sessionId: id },
      relations: ['paymentMethod', 'createdByUser'],
      order: { occurredAt: 'ASC', id: 'ASC' },
    });

    const totals = movements.reduce(
      (acc, item) => {
        const amount = Number(item.amount || 0);
        if (item.direction === 'IN') acc.in += amount;
        if (item.direction === 'OUT') acc.out += amount;
        if (item.type === 'WITHDRAWAL') acc.withdrawals += amount;
        const method = item.paymentMethod?.name || 'Sem forma';
        acc.byPaymentMethod[method] =
          (acc.byPaymentMethod[method] || 0) + amount;
        return acc;
      },
      {
        in: 0,
        out: 0,
        withdrawals: 0,
        byPaymentMethod: {} as Record<string, number>,
      },
    );

    return { session, movements, totals };
  }

  async listMovements(sessionId: number) {
    await this.findSession(sessionId);
    return this.movementsRepository.find({
      where: { sessionId },
      relations: ['paymentMethod', 'createdByUser', 'sale'],
      order: { occurredAt: 'ASC', id: 'ASC' },
    });
  }

  async withdraw(sessionId: number, payload: any, currentUserId: number) {
    const occurredAt = payload.occurredAt
      ? new Date(payload.occurredAt)
      : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestException('Data da sangria inválida.');
    }

    return this.sessionsRepository.manager.transaction(async (manager) => {
      const session = await this.lockOpenSession(
        manager,
        sessionId,
        currentUserId,
      );
      const amount = this.normalizeMoney(payload.amount);
      const expected = this.normalizeMoney(session.expectedCashAmount || 0);
      if (amount > expected) {
        throw new BadRequestException(
          'Sangria não pode ser maior que o saldo esperado em dinheiro.',
        );
      }

      const movement = await manager.getRepository(CashRegisterMovement).save(
        manager.getRepository(CashRegisterMovement).create({
          sessionId: session.id,
          terminalId: session.terminalId,
          type: 'WITHDRAWAL',
          direction: 'OUT',
          amount,
          createdByUserId: currentUserId,
          occurredAt,
          notes: this.requiredText(
            payload.notes,
            'Motivo da sangria é obrigatório.',
          ),
        }),
      );

      session.expectedCashAmount = this.normalizeMoney(expected - amount);
      await manager.getRepository(CashRegisterSession).save(session);
      return { session: await this.findSession(session.id, manager), movement };
    });
  }

  async closeSession(sessionId: number, payload: any, currentUserId: number) {
    const closedAt = payload.closedAt ? new Date(payload.closedAt) : new Date();
    if (Number.isNaN(closedAt.getTime())) {
      throw new BadRequestException('Data de fechamento inválida.');
    }

    return this.sessionsRepository.manager.transaction(async (manager) => {
      const session = await this.lockOpenSession(
        manager,
        sessionId,
        currentUserId,
      );
      const expected = this.normalizeMoney(session.expectedCashAmount || 0);
      const declared = this.normalizeMoney(payload.declaredCashAmount || 0);
      session.status = 'CLOSED';
      session.closedAt = closedAt;
      session.closedByUserId = currentUserId;
      session.declaredCashAmount = declared;
      session.cashDifference = this.normalizeMoney(declared - expected);
      session.closingNotes = this.optionalText(payload.closingNotes);
      return manager.getRepository(CashRegisterSession).save(session);
    });
  }

  async registerSalePayment(
    manager: EntityManager,
    params: {
      sessionId: number;
      sale: Sale;
      payment: Payment;
      paymentMethod: PaymentMethod;
      amount: number;
      paidAt: Date;
      notes?: string | null;
      currentUserId: number;
    },
  ) {
    const session = await this.lockOpenSession(
      manager,
      params.sessionId,
      params.currentUserId,
    );
    const amount = this.normalizeMoney(params.amount);

    await manager.getRepository(CashRegisterMovement).save(
      manager.getRepository(CashRegisterMovement).create({
        sessionId: session.id,
        terminalId: session.terminalId,
        type: 'SALE_PAYMENT',
        direction: 'IN',
        amount,
        paymentMethodId: params.paymentMethod.id,
        saleId: params.sale.id,
        paymentId: params.payment.id,
        createdByUserId: params.currentUserId,
        occurredAt: params.paidAt,
        notes: params.notes || `Recebimento da venda #${params.sale.id}`,
      }),
    );

    if (this.isCashPayment(params.paymentMethod)) {
      session.expectedCashAmount = this.normalizeMoney(
        Number(session.expectedCashAmount || 0) + amount,
      );
      await manager.getRepository(CashRegisterSession).save(session);
    }
  }

  async registerCheckoutUndo(
    manager: EntityManager,
    params: {
      sessionId: number;
      saleId: number;
      payment: Payment;
      paymentMethod?: PaymentMethod | null;
      occurredAt: Date;
      currentUserId: number;
    },
  ) {
    const session = await this.lockOpenSession(
      manager,
      params.sessionId,
      params.currentUserId,
    );
    const amount = this.normalizeMoney(params.payment.amount || 0);
    await manager.getRepository(CashRegisterMovement).save(
      manager.getRepository(CashRegisterMovement).create({
        sessionId: session.id,
        terminalId: session.terminalId,
        type: 'CHECKOUT_UNDO',
        direction: 'OUT',
        amount,
        paymentMethodId: params.payment.paymentMethodId,
        saleId: params.saleId,
        paymentId: params.payment.id,
        createdByUserId: params.currentUserId,
        occurredAt: params.occurredAt,
        notes: `Estorno do recebimento da venda #${params.saleId}`,
      }),
    );

    if (params.paymentMethod && this.isCashPayment(params.paymentMethod)) {
      session.expectedCashAmount = this.normalizeMoney(
        Number(session.expectedCashAmount || 0) - amount,
      );
      await manager.getRepository(CashRegisterSession).save(session);
    }
  }

  async ensureSessionCanUndoCheckout(
    manager: EntityManager,
    sessionId: number,
    currentUserId?: number,
  ) {
    await this.lockOpenSession(manager, sessionId, currentUserId);
  }

  async receiptPreview(saleId: number) {
    const sale = await this.loadSaleForReceipt(saleId);
    return this.buildReceiptPayloadAndContent(sale, false);
  }

  async printSaleReceipt(
    saleId: number,
    payload: {
      printerId?: number;
      copies?: number;
      receiptPayments?: PrintReceiptPaymentDto[];
    },
    currentUserId: number,
  ) {
    const sale = await this.loadSaleForReceipt(saleId);
    const receiptPayments = payload.receiptPayments?.length
      ? payload.receiptPayments.map((payment) => {
          const salePayment = sale.payments?.find(
            (item) =>
              Number(item.paymentMethodId) === Number(payment.paymentMethodId),
          );
          return {
            ...payment,
            paymentMethod: salePayment?.paymentMethod,
          };
        })
      : undefined;
    const receipt = await this.buildReceiptPayloadAndContent(
      sale,
      true,
      receiptPayments,
    );
    const printerId =
      payload.printerId ||
      sale.cashRegisterSession?.terminal?.defaultPrinterId ||
      null;
    if (printerId) {
      await this.ensureActivePrinter(printerId);
    }

    const job = await this.printJobsRepository.save(
      this.printJobsRepository.create({
        printerId,
        terminalId: sale.cashRegisterSession?.terminalId ?? null,
        cashRegisterSessionId: sale.cashRegisterSessionId ?? null,
        saleId: sale.id,
        type: 'SALE_RECEIPT',
        status: 'RENDERED',
        copies: Math.max(1, Number(payload.copies || 1)),
        payloadJson: receipt.payload,
        renderedContent: receipt.content,
        requestedByUserId: currentUserId,
      }),
    );

    return { job, ...receipt };
  }

  private async loadSaleForReceipt(saleId: number) {
    const sale = await this.sessionsRepository.manager
      .getRepository(Sale)
      .findOne({
        where: { id: saleId },
        relations: [
          'client',
          'veterinarian',
          'items',
          'items.product',
          'items.procedure',
          'payments',
          'payments.paymentMethod',
          'cashRegisterSession',
          'cashRegisterSession.terminal',
          'cashRegisterSession.terminal.defaultPrinter',
          'cashRegisterSession.openedByUser',
        ],
      });
    if (!sale) {
      throw new NotFoundException(`Venda ${saleId} não encontrada.`);
    }
    if (sale.status !== 'PAID') {
      throw new ConflictException('Apenas vendas pagas podem gerar cupom.');
    }
    return sale as Sale & { cashRegisterSession?: CashRegisterSession | null };
  }

  private async buildReceiptPayloadAndContent(
    sale: Sale & { cashRegisterSession?: CashRegisterSession | null },
    reprint: boolean,
    receiptPayments?: any[],
  ) {
    const clinic = await this.sessionsRepository.manager
      .getRepository(ClinicSettings)
      .findOne({ where: {} as any, order: { id: 'ASC' } });
    const columns =
      sale.cashRegisterSession?.terminal?.defaultPrinter?.columns ||
      (sale.cashRegisterSession?.terminal?.defaultPrinter?.paperWidthMm === 58
        ? 32
        : 48);

    const payload = {
      clinic,
      sale,
      reprint,
      receiptPayments,
      generatedAt: new Date().toISOString(),
      columns,
    };

    return {
      payload,
      content: this.renderThermalReceipt(payload),
    };
  }

  private renderThermalReceipt(payload: any) {
    const { clinic, sale, columns, reprint } = payload;
    const line = '-'.repeat(columns);
    const money = (value: any) =>
      new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value || 0));
    const quantity = (value: any, unit?: string | null) => {
      const numericValue = Number(value || 0);
      if (unit === 'kg') {
        return `${new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }).format(numericValue)} kg`;
      }
      if (Number.isInteger(numericValue)) return String(numericValue);
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }).format(numericValue);
    };
    const center = (value: string) => {
      const text = String(value || '').slice(0, columns);
      const left = Math.max(0, Math.floor((columns - text.length) / 2));
      return `${' '.repeat(left)}${text}`;
    };
    const row = (left: string, right: string) => {
      const r = String(right || '');
      const l = String(left || '').slice(
        0,
        Math.max(0, columns - r.length - 1),
      );
      return `${l}${' '.repeat(Math.max(1, columns - l.length - r.length))}${r}`;
    };
    const wrap = (value: string) => {
      const text = String(value || '');
      const lines: string[] = [];
      for (let i = 0; i < text.length; i += columns) {
        lines.push(text.slice(i, i + columns));
      }
      return lines;
    };

    const lines: string[] = [
      center(clinic?.name || 'Clinica Veterinaria'),
      ...(clinic?.cnpj ? [center(`CNPJ: ${clinic.cnpj}`)] : []),
      ...(clinic?.address ? wrap(clinic.address) : []),
      ...(clinic?.phone ? [center(`TEL: ${clinic.phone}`)] : []),
      line,
      center('CUPOM NAO FISCAL'),
      ...(reprint ? [center('REIMPRESSAO')] : []),
      row('Venda', `#${sale.id}`),
      row('Caixa', sale.cashRegisterSession?.terminal?.name || '-'),
      row('Operador', sale.cashRegisterSession?.openedByUser?.name || '-'),
      row(
        'Data',
        this.formatDateTime(sale.payments?.[0]?.paidAt || new Date()),
      ),
      line,
      'ITEM',
    ];

    for (const item of sale.items || []) {
      const description =
        item.product?.name || item.procedure?.name || `Item #${item.id}`;
      lines.push(...wrap(description));
      const unit =
        item.product?.saleMode === 'WEIGHT'
          ? item.product?.saleUnit || item.product?.unit || 'kg'
          : null;
      lines.push(
        row(
          `${quantity(item.quantity, unit)} x ${money(item.unitPrice)}`,
          money(item.totalPrice),
        ),
      );
    }

    lines.push(
      line,
      row('Subtotal', money(sale.subtotal)),
      row('Desconto', money(sale.discountAmount)),
      row('TOTAL', money(sale.totalAmount)),
      line,
      'Pagamento',
    );

    const receiptPayments = payload.receiptPayments?.length
      ? payload.receiptPayments
      : sale.payments || [];

    for (const payment of receiptPayments) {
      lines.push(
        row(payment.paymentMethod?.name || 'Pagamento', money(payment.amount)),
      );
      const tenderedAmount = Number(
        payment.tenderedAmount ?? payment.amount ?? 0,
      );
      const changeAmount = Number(
        payment.changeAmount ??
          Math.max(0, tenderedAmount - Number(payment.amount || 0)),
      );
      if (this.isCashPayment(payment.paymentMethod) && changeAmount > 0) {
        lines.push(row('Valor recebido', money(tenderedAmount)));
        lines.push(row('Troco', money(changeAmount)));
      }
    }

    lines.push(line, center('Obrigado pela preferencia'), '');
    return lines.join('\n');
  }

  private async lockOpenSession(
    manager: EntityManager,
    sessionId: number,
    currentUserId?: number,
  ) {
    const qb = manager
      .getRepository(CashRegisterSession)
      .createQueryBuilder('session')
      .setLock('pessimistic_write')
      .where('session.id = :id', { id: sessionId });

    if (currentUserId) {
      qb.andWhere('session.openedByUserId = :currentUserId', { currentUserId });
    }

    const session = await qb.getOne();

    if (!session) {
      throw new NotFoundException(
        `Sessão de caixa ${sessionId} não encontrada para este operador.`,
      );
    }
    if (session.status !== 'OPEN') {
      throw new ConflictException(
        'Sessão de caixa não está aberta para este operador.',
      );
    }
    return session;
  }

  private isCashPayment(paymentMethod: PaymentMethod) {
    const code = this.normalizeCode(paymentMethod.code);
    const name = this.normalizeCode(paymentMethod.name);
    return ['CASH', 'DINHEIRO'].includes(code) || name.includes('DINHEIRO');
  }

  private async ensureActivePrinter(id: number) {
    const printer = await this.printersRepository.findOne({ where: { id } });
    if (!printer || !printer.isActive) {
      throw new BadRequestException('Impressora inexistente ou inativa.');
    }
    return printer;
  }

  private async ensureUniqueTerminalCode(code: string, ignoreId?: number) {
    const qb = this.terminalsRepository
      .createQueryBuilder('terminal')
      .where('terminal.code = :code', { code });
    if (ignoreId) qb.andWhere('terminal.id != :ignoreId', { ignoreId });
    if (await qb.getOne()) {
      throw new ConflictException('Já existe terminal com esse código.');
    }
  }

  private async ensureUniquePrinterCode(code: string, ignoreId?: number) {
    const qb = this.printersRepository
      .createQueryBuilder('printer')
      .where('printer.code = :code', { code });
    if (ignoreId) qb.andWhere('printer.id != :ignoreId', { ignoreId });
    if (await qb.getOne()) {
      throw new ConflictException('Já existe impressora com esse código.');
    }
  }

  private async summary() {
    const [openSessions, terminals, printers] = await Promise.all([
      this.sessionsRepository.find({ where: { status: 'OPEN' } }),
      this.terminalsRepository.count({ where: { isActive: true } }),
      this.printersRepository.count({ where: { isActive: true } }),
    ]);
    const openCashAmount = openSessions.reduce(
      (sum, session) => sum + Number(session.expectedCashAmount || 0),
      0,
    );
    return {
      openSessions: openSessions.length,
      openCashAmount,
      activeTerminals: terminals,
      activePrinters: printers,
    };
  }

  private normalizeCode(value: unknown) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private requiredText(value: unknown, message: string) {
    const text = String(value || '').trim();
    if (!text) {
      throw new BadRequestException(message);
    }
    return text;
  }

  private optionalText(value: unknown) {
    const text = String(value || '').trim();
    return text || null;
  }

  private normalizeMoney(value: number | string) {
    const parsed = Number(value || 0);
    return Math.round((parsed + Number.EPSILON) * 100) / 100;
  }

  private parseBoolean(value: unknown) {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  }

  private formatDateTime(value: Date | string) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(value));
  }
}
