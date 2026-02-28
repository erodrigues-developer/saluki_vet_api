import { Injectable, NotFoundException } from '@nestjs/common';
import {
  SalesRepository,
  SalesFilterOptions,
} from './repositories/sales.repository';
import { Sale } from './entities/sale.entity';

@Injectable()
export class SalesService {
  constructor(private readonly salesRepository: SalesRepository) {}

  async create(payload: Partial<Sale>): Promise<Sale> {
    const sale = this.salesRepository.create(payload);
    return this.salesRepository.save(sale);
  }

  async findAll(filters: SalesFilterOptions) {
    return this.salesRepository.findPaginated(filters);
  }

  async findOne(id: number): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: [
        'client',
        'veterinarian',
        'items',
        'items.product',
        'payments',
        'payments.paymentMethod',
      ],
    });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    return sale;
  }

  async update(id: number, payload: any): Promise<Sale> {
    const sale = await this.salesRepository.findOne({ where: { id } });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    Object.assign(sale, payload);
    return this.salesRepository.save(sale);
  }

  async remove(id: number): Promise<void> {
    const sale = await this.salesRepository.findOne({ where: { id } });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    await this.salesRepository.remove(sale);
  }
}
