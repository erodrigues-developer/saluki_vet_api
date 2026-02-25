import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentsRepository extends Repository<Payment> {
  constructor(private readonly dataSource: DataSource) {
    super(Payment, dataSource.createEntityManager());
  }

  async findBySale(saleId: number): Promise<Payment[]> {
    return this.find({
      where: { saleId },
      relations: ['paymentMethod'],
      order: {
        paidAt: 'DESC',
      },
    });
  }
}
