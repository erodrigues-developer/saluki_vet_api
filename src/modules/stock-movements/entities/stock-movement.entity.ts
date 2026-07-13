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
import { StockBatch } from '../../stock-batches/entities/stock-batch.entity';
import { StockLocation } from '../../stock-locations/entities/stock-location.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'stock_movements' })
export class StockMovement {
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

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'stock_batch_id', type: 'bigint', nullable: true })
  stockBatchId?: number | null;

  @ManyToOne(() => StockBatch, { nullable: true })
  @JoinColumn({ name: 'stock_batch_id' })
  stockBatch?: StockBatch | null;

  @ApiProperty({
    example: 'IN',
    description: 'IN | OUT | ADJUSTMENT_IN | ADJUSTMENT_OUT',
  })
  @Column({ name: 'movement_type', type: 'varchar', length: 20 })
  movementType: string;

  @ApiProperty({ example: 10.5 })
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

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
  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt: Date;

  @ApiProperty({ example: 'SALE', nullable: true })
  @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  referenceType?: string | null;

  @ApiProperty({ example: 123, nullable: true })
  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  referenceId?: number | null;

  @ApiProperty({ example: 'Ajuste de inventário', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: 'Perda', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  reason?: string | null;

  @ApiProperty({ example: 10, nullable: true })
  @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
  createdByUserId?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: User | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
