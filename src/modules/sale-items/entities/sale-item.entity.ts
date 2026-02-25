import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sale } from '../../sales/entities/sale.entity';
import { Product } from '../../products/entities/product.entity';

@Entity({ name: 'sale_items' })
export class SaleItem {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'sale_id', type: 'bigint' })
  saleId: number;

  @ManyToOne(() => Sale, (sale) => sale.items)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ApiProperty({ example: 1 })
  @Column({ name: 'product_id', type: 'bigint' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ example: 1 })
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 1 })
  quantity: number;

  @ApiProperty({ example: 150.0 })
  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty({ example: 10.0 })
  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @ApiProperty({ example: 140.0 })
  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;
}
