import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductCategory } from '../../product-categories/entities/product-category.entity';

@Entity({ name: 'products' })
export class Product {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'product_category_id', type: 'bigint', nullable: true })
  productCategoryId?: number | null;

  @ManyToOne(() => ProductCategory, (category) => category.products, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'product_category_id' })
  productCategory?: ProductCategory | null;

  @ApiProperty({ example: 'Vacina V10' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ example: 'SKU-12345', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string | null;

  @ApiProperty({ example: false, description: 'Serviço vs Produto físico' })
  @Column({ name: 'is_service', type: 'boolean', default: false })
  isService: boolean;

  @ApiProperty({ example: 'dose', nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string | null;

  @ApiProperty({ example: 120.0 })
  @Column({
    name: 'sale_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  salePrice: number;

  @ApiProperty({ example: 50.0, nullable: true })
  @Column({
    name: 'cost_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  costPrice?: number | null;

  @ApiProperty({ example: true, description: 'Rastrear estoque' })
  @Column({ name: 'track_stock', type: 'boolean', default: true })
  trackStock: boolean;

  @ApiProperty({ example: true, description: 'Produto é uma vacina?' })
  @Column({ name: 'is_vaccine', type: 'boolean', default: false })
  isVaccine: boolean;

  @ApiProperty({ example: 'Armazenar entre 2 e 8 graus', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;
}
