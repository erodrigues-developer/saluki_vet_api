import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SaleItem } from '../entities/sale-item.entity';

@Injectable()
export class SaleItemsRepository extends Repository<SaleItem> {
  constructor(private readonly dataSource: DataSource) {
    super(SaleItem, dataSource.createEntityManager());
  }

  async findBySale(saleId: number): Promise<SaleItem[]> {
    return this.find({
      where: { saleId },
      relations: ['product', 'procedure'],
    });
  }
}
