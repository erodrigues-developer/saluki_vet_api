import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethodsRepository, PaymentMethodsFilterOptions } from './repositories/payment-methods.repository';
import { PaymentMethod } from './entities/payment-method.entity';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly paymentMethodsRepository: PaymentMethodsRepository) {}

  async create(payload: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const paymentMethod = this.paymentMethodsRepository.create(payload);
    return this.paymentMethodsRepository.save(paymentMethod);
  }

  async findAll(filters: PaymentMethodsFilterOptions) {
    return this.paymentMethodsRepository.findPaginated(filters);
  }

  async findOne(id: number): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodsRepository.findOne({ where: { id } });
    if (!paymentMethod) {
      throw new NotFoundException(`PaymentMethod with ID ${id} not found`);
    }
    return paymentMethod;
  }

  async update(id: number, payload: any): Promise<PaymentMethod> {
    const paymentMethod = await this.findOne(id);
    Object.assign(paymentMethod, payload);
    return this.paymentMethodsRepository.save(paymentMethod);
  }

  async remove(id: number): Promise<void> {
    const paymentMethod = await this.findOne(id);
    await this.paymentMethodsRepository.remove(paymentMethod);
  }
}
