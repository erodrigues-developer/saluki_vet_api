import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentsRepository } from './repositories/payments.repository';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  async create(payload: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentsRepository.create(payload);
    return this.paymentsRepository.save(payment);
  }

  async findBySale(saleId: number): Promise<Payment[]> {
    return this.paymentsRepository.findBySale(saleId);
  }

  async remove(id: number): Promise<void> {
    const payment = await this.paymentsRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    await this.paymentsRepository.remove(payment);
  }
}
