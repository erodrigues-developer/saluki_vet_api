import { Injectable, NotFoundException } from '@nestjs/common';
import { SaleItemsRepository } from './repositories/sale-items.repository';
import { SaleItem } from './entities/sale-item.entity';

@Injectable()
export class SaleItemsService {
  constructor(private readonly saleItemsRepository: SaleItemsRepository) {}

  async create(payload: Partial<SaleItem>): Promise<SaleItem> {
    const saleItem = this.saleItemsRepository.create(payload);
    return this.saleItemsRepository.save(saleItem);
  }

  async findBySale(saleId: number): Promise<SaleItem[]> {
    return this.saleItemsRepository.findBySale(saleId);
  }

  async remove(id: number): Promise<void> {
    const saleItem = await this.saleItemsRepository.findOne({ where: { id } });
    if (!saleItem) {
      throw new NotFoundException(`SaleItem with ID ${id} not found`);
    }
    await this.saleItemsRepository.remove(saleItem);
  }
}
