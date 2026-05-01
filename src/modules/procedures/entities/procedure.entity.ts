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

@Entity({ name: 'procedures' })
export class Procedure {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'Consulta Clínica' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ example: 'Avaliação geral do animal', nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 150.0 })
  @Column({
    name: 'default_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  defaultPrice?: number | null;

  @ApiProperty({ example: 15, description: 'Percentual de comissao (0 a 100)' })
  @Column({
    name: 'commission_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  commissionPercent: number;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'consumed_product_id', type: 'bigint', nullable: true })
  consumedProductId?: number | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'consumed_product_id' })
  consumedProduct?: Product | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({
    name: 'consumption_quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  consumptionQuantity?: number | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
