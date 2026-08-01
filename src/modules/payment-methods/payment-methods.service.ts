import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  PaymentMethodsRepository,
  PaymentMethodsFilterOptions,
} from './repositories/payment-methods.repository';
import { PaymentMethod } from './entities/payment-method.entity';
import {
  FISCAL_PAYMENT_TYPE_CODES,
  normalizeFiscalPaymentTypeCode,
} from '../fiscal/fiscal-payment-types';

@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly paymentMethodsRepository: PaymentMethodsRepository,
  ) {}

  async create(payload: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const paymentMethod = this.paymentMethodsRepository.create(
      this.normalizePayload(payload),
    );
    return this.paymentMethodsRepository.save(paymentMethod);
  }

  async findAll(filters: PaymentMethodsFilterOptions) {
    return this.paymentMethodsRepository.findPaginated(filters);
  }

  async findOne(id: number): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodsRepository.findOne({
      where: { id },
    });
    if (!paymentMethod) {
      throw new NotFoundException(`PaymentMethod with ID ${id} not found`);
    }
    return paymentMethod;
  }

  async update(id: number, payload: any): Promise<PaymentMethod> {
    const paymentMethod = await this.findOne(id);
    Object.assign(paymentMethod, this.normalizePayload(payload));
    return this.paymentMethodsRepository.save(paymentMethod);
  }

  async remove(id: number): Promise<void> {
    const paymentMethod = await this.findOne(id);
    await this.paymentMethodsRepository.remove(paymentMethod);
  }

  private normalizePayload(payload: Partial<PaymentMethod>) {
    const next = { ...payload };
    delete (next as Partial<PaymentMethod> & { cardBrandCode?: unknown })
      .cardBrandCode;
    if ('fiscalPaymentTypeCode' in next) {
      const code = normalizeFiscalPaymentTypeCode(next.fiscalPaymentTypeCode);
      if (code && !FISCAL_PAYMENT_TYPE_CODES.has(code)) {
        throw new BadRequestException(
          'Código fiscal NFC-e da forma de pagamento inválido.',
        );
      }
      next.fiscalPaymentTypeCode = code || null;
    }
    return next;
  }
}
