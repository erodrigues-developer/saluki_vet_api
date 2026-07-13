import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { StockLocation } from '../../stock-locations/entities/stock-location.entity';

@Entity({ name: 'stock_batches' })
export class StockBatch {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'product_id', type: 'bigint' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @ApiProperty({ example: 1 })
  @Column({ name: 'stock_location_id', type: 'bigint' })
  stockLocationId: number;

  @ManyToOne(() => StockLocation)
  @JoinColumn({ name: 'stock_location_id' })
  stockLocation?: StockLocation;

  @ApiProperty({ example: 'LOTE-2026-001' })
  @Column({ name: 'lot_code', type: 'varchar', length: 100 })
  lotCode: string;

  @ApiProperty({ example: '2027-03-31' })
  @Column({ name: 'expiration_date', type: 'date' })
  expirationDate: string;

  @ApiProperty({ example: 10 })
  @Column({
    name: 'initial_quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
  })
  initialQuantity: number;

  @ApiProperty({ example: 4 })
  @Column({
    name: 'remaining_quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
  })
  remainingQuantity: number;

  @ApiProperty({ example: 50.0, nullable: true })
  @Column({
    name: 'unit_cost',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  unitCost?: number | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
