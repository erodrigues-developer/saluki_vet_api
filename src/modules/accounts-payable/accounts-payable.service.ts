import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AccountPayable } from './entities/account-payable.entity';
import { CreateAccountPayableDto } from './dto/create-account-payable.dto';
import { PayAccountDto } from './dto/pay-account.dto';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { UpdateAccountPayableDto } from './dto/update-account-payable.dto';
import { User } from '../users/entities/user.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { CommissionsService } from '../commissions/commissions.service';

@Injectable()
export class AccountsPayableService {
  constructor(
    @InjectRepository(AccountPayable)
    private readonly repository: Repository<AccountPayable>,
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodsRepository: Repository<PaymentMethod>,
    private readonly commissionsService: CommissionsService,
  ) {}

  async create(dto: CreateAccountPayableDto): Promise<AccountPayable> {
    this.ensureManualAccountHasCounterparty(
      dto.originType,
      dto.supplierId,
      dto.beneficiaryUserId,
    );
    await this.ensureRelatedParties(dto.supplierId, dto.beneficiaryUserId);

    const entity = this.repository.create({
      ...dto,
      status: 'PENDING',
      originType: dto.originType || 'MANUAL',
    });
    return this.repository.save(entity);
  }

  async update(
    id: number,
    dto: UpdateAccountPayableDto & {
      beneficiaryUserId?: number | null;
      originType?: string;
      originReferenceId?: number | null;
    },
  ): Promise<AccountPayable> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) throw new NotFoundException('Account not found');

    this.ensureManualAccountHasCounterparty(
      dto.originType || entity.originType,
      dto.supplierId !== undefined ? dto.supplierId : entity.supplierId,
      dto.beneficiaryUserId !== undefined
        ? dto.beneficiaryUserId
        : entity.beneficiaryUserId,
    );
    await this.ensureRelatedParties(dto.supplierId, dto.beneficiaryUserId);

    const merged = this.repository.merge(entity, dto as any);
    return this.repository.save(merged);
  }

  async findAll(
    category?: string,
    month?: number,
    year?: number,
    status?: string,
  ): Promise<AccountPayable[]> {
    const query = this.repository
      .createQueryBuilder('ap')
      .leftJoinAndSelect('ap.supplier', 'supplier')
      .leftJoinAndSelect('ap.beneficiaryUser', 'beneficiaryUser')
      .leftJoinAndSelect('ap.paymentMethodRelation', 'paymentMethodRelation');

    if (category) {
      query.andWhere('ap.category = :category', { category });
    }

    if (month && year) {
      query.andWhere('EXTRACT(MONTH FROM ap.dueDate) = :month', { month });
      query.andWhere('EXTRACT(YEAR FROM ap.dueDate) = :year', { year });
    }

    this.applyStatusFilter(query, status);

    query.orderBy('ap.dueDate', 'ASC');

    return query.getMany();
  }

  async markAsPaid(id: number, dto: PayAccountDto): Promise<AccountPayable> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) throw new NotFoundException('Account not found');

    if (entity.status === 'CANCELED') {
      throw new BadRequestException(
        'Não é possível registrar pagamento em uma conta cancelada.',
      );
    }

    const paymentData = await this.resolvePaymentMethod(dto);
    const paidAt = new Date(dto.paidAt);
    if (Number.isNaN(paidAt.getTime())) {
      throw new BadRequestException('Data de pagamento inválida.');
    }

    entity.status = 'PAID';
    entity.paidAt = paidAt;
    entity.paidAmount = Number(dto.paidAmount);
    entity.paymentMethodId = paymentData.paymentMethodId;
    entity.paymentMethod = paymentData.paymentMethod;

    const saved = await this.repository.save(entity);

    if (saved.originType === 'COMMISSION_PAYOUT') {
      await this.commissionsService.markPayoutAsPaidByAccountPayable(
        saved.id,
        paidAt,
      );
    }

    return saved;
  }

  async undoPayment(id: number): Promise<AccountPayable> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) throw new NotFoundException('Account not found');

    entity.status = 'PENDING';
    entity.paidAt = null;
    entity.paidAmount = null;
    entity.paymentMethodId = null;
    entity.paymentMethod = null;

    const saved = await this.repository.save(entity);

    if (saved.originType === 'COMMISSION_PAYOUT') {
      await this.commissionsService.reopenPayoutByAccountPayable(saved.id);
    }

    return saved;
  }

  async getDashboardMetrics(
    month?: number,
    year?: number,
    category?: string,
    status?: string,
  ) {
    const query = this.repository.createQueryBuilder('ap');

    if (month && year) {
      query.andWhere('EXTRACT(MONTH FROM ap.dueDate) = :month', { month });
      query.andWhere('EXTRACT(YEAR FROM ap.dueDate) = :year', { year });
    }
    if (category && category !== 'Todas as Despesas') {
      query.andWhere('ap.category = :category', { category });
    }
    this.applyStatusFilter(query, status);

    const allPayables = await query.getMany();

    let totalPending = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    let expectedTotal = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const categoryData: Record<string, number> = {};
    const flowData: Record<
      string,
      { paid: number; pending: number; overdue: number }
    > = {};

    for (const ap of allPayables) {
      const amount = Number(ap.amount);
      if (ap.status !== 'CANCELED') {
        expectedTotal += amount;
      }

      const due = new Date(ap.dueDate);

      const isOverdue =
        ap.status === 'PENDING' && due.valueOf() < now.valueOf();

      if (ap.status === 'PAID') {
        const paidAmount = Number(ap.paidAmount || ap.amount);
        totalPaid += paidAmount;
      } else if (ap.status === 'PENDING') {
        totalPending += amount;
        if (isOverdue) totalOverdue += amount;
      }

      const cat = ap.category || 'Sem Categoria';
      if (!categoryData[cat]) categoryData[cat] = 0;
      categoryData[cat] += amount;

      const day = due.getDate();
      if (!flowData[day]) flowData[day] = { paid: 0, pending: 0, overdue: 0 };

      if (ap.status === 'PAID') {
        flowData[day].paid += Number(ap.paidAmount || ap.amount);
      } else if (ap.status === 'PENDING') {
        if (isOverdue) {
          flowData[day].overdue += amount;
        } else {
          flowData[day].pending += amount;
        }
      }
    }

    return {
      data: {
        kpis: {
          totalPending,
          totalPaid,
          totalOverdue,
          expectedTotal,
        },
        charts: {
          categoryPie: Object.entries(categoryData).map(([name, value]) => ({
            name,
            value,
          })),
          flowBar: Object.entries(flowData)
            .map(([day, data]) => ({
              day: parseInt(day),
              ...data,
            }))
            .sort((a, b) => a.day - b.day),
        },
      },
    };
  }

  private applyStatusFilter(
    query: SelectQueryBuilder<AccountPayable>,
    status?: string,
  ): void {
    if (!status || status === 'ALL') {
      return;
    }

    if (status === 'OVERDUE') {
      query.andWhere('ap.status = :pendingStatus', {
        pendingStatus: 'PENDING',
      });
      query.andWhere('ap.dueDate < CURRENT_DATE');
      return;
    }

    query.andWhere('ap.status = :status', { status });
  }

  private async ensureRelatedParties(
    supplierId?: number | null,
    beneficiaryUserId?: number | null,
  ): Promise<void> {
    if (supplierId) {
      const supplier = await this.suppliersRepository.findOneBy({
        id: supplierId,
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }
    }

    if (beneficiaryUserId) {
      const user = await this.usersRepository.findOneBy({
        id: beneficiaryUserId,
      });

      if (!user) {
        throw new NotFoundException('Beneficiary user not found');
      }
    }
  }

  private ensureManualAccountHasCounterparty(
    originType: string | undefined,
    supplierId?: number | null,
    beneficiaryUserId?: number | null,
  ) {
    if (originType === 'COMMISSION_PAYOUT') {
      return;
    }

    if (!supplierId && !beneficiaryUserId) {
      throw new BadRequestException(
        'Informe um fornecedor ou beneficiário para a conta a pagar.',
      );
    }
  }

  private async resolvePaymentMethod(
    dto: PayAccountDto,
  ): Promise<{ paymentMethodId: number | null; paymentMethod: string | null }> {
    if (dto.paymentMethodId) {
      const paymentMethod = await this.paymentMethodsRepository.findOne({
        where: { id: dto.paymentMethodId },
      });

      if (!paymentMethod || !paymentMethod.isActive) {
        throw new BadRequestException(
          'Forma de pagamento inexistente ou inativa.',
        );
      }

      return {
        paymentMethodId: paymentMethod.id,
        paymentMethod: paymentMethod.name,
      };
    }

    if (dto.paymentMethod) {
      return {
        paymentMethodId: null,
        paymentMethod: dto.paymentMethod,
      };
    }

    throw new BadRequestException('Forma de pagamento é obrigatória.');
  }
}
