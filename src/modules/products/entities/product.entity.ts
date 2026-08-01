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

  @ApiProperty({ example: '7891234567890', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode?: string | null;

  @ApiProperty({
    example: 'https://cdn.example.com/products/vacina-v10.png',
    nullable: true,
  })
  @Column({ name: 'img_url', type: 'text', nullable: true })
  imgUrl?: string | null;

  @ApiProperty({ example: false, description: 'Serviço vs Produto físico' })
  @Column({ name: 'is_service', type: 'boolean', default: false })
  isService: boolean;

  @ApiProperty({
    example: 45,
    nullable: true,
    description: 'Duração do serviço em minutos',
  })
  @Column({ name: 'duration_minutes', type: 'integer', nullable: true })
  durationMinutes?: number | null;

  @ApiProperty({ example: 'dose', nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string | null;

  @ApiProperty({ example: 'UNIT', description: 'UNIT ou WEIGHT' })
  @Column({ name: 'sale_mode', type: 'varchar', length: 20, default: 'UNIT' })
  saleMode: string;

  @ApiProperty({ example: 'kg', nullable: true })
  @Column({
    name: 'sale_unit',
    type: 'varchar',
    length: 20,
    nullable: true,
    default: 'un',
  })
  saleUnit?: string | null;

  @ApiProperty({
    example: false,
    description: 'Produto aceita etiqueta de balança no PDV',
  })
  @Column({ name: 'scale_barcode_enabled', type: 'boolean', default: false })
  scaleBarcodeEnabled: boolean;

  @ApiProperty({ example: '2', nullable: true })
  @Column({
    name: 'scale_barcode_prefix',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  scaleBarcodePrefix?: string | null;

  @ApiProperty({ example: '00045', nullable: true })
  @Column({
    name: 'scale_barcode_product_code',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  scaleBarcodeProductCode?: string | null;

  @ApiProperty({ example: 'WEIGHT', nullable: true })
  @Column({
    name: 'scale_barcode_type',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  scaleBarcodeType?: string | null;

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

  @ApiProperty({ example: 5, nullable: true, description: 'Estoque mínimo' })
  @Column({
    name: 'minimum_stock',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  minimumStock?: number | null;

  @ApiProperty({ example: true, description: 'Produto é uma vacina?' })
  @Column({ name: 'is_vaccine', type: 'boolean', default: false })
  isVaccine: boolean;

  @ApiProperty({ example: false, description: 'Controlar validade por lote' })
  @Column({ name: 'tracks_expiration', type: 'boolean', default: false })
  tracksExpiration: boolean;

  @ApiProperty({ example: '30049099', nullable: true })
  @Column({ name: 'fiscal_ncm', type: 'varchar', length: 20, nullable: true })
  fiscalNcm?: string | null;

  @ApiProperty({ example: '1300100', nullable: true })
  @Column({ name: 'fiscal_cest', type: 'varchar', length: 20, nullable: true })
  fiscalCest?: string | null;

  @ApiProperty({ example: '0', nullable: true })
  @Column({ name: 'fiscal_origin', type: 'varchar', length: 5, nullable: true })
  fiscalOrigin?: string | null;

  @ApiProperty({ example: '5102', nullable: true })
  @Column({
    name: 'fiscal_cfop_nfce_default',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  fiscalCfopNfceDefault?: string | null;

  @ApiProperty({ example: 'SEM GTIN', nullable: true })
  @Column({ name: 'fiscal_ean', type: 'varchar', length: 32, nullable: true })
  fiscalEan?: string | null;

  @ApiProperty({ example: 'SEM GTIN', nullable: true })
  @Column({
    name: 'fiscal_ean_tributable',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  fiscalEanTributable?: string | null;

  @ApiProperty({ example: 'UN', nullable: true })
  @Column({
    name: 'fiscal_unit_tributable',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  fiscalUnitTributable?: string | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({
    name: 'fiscal_conversion_factor',
    type: 'decimal',
    precision: 12,
    scale: 6,
    nullable: true,
  })
  fiscalConversionFactor?: number | null;

  @ApiProperty({ example: '00', nullable: true })
  @Column({
    name: 'fiscal_icms_cst',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  fiscalIcmsCst?: string | null;

  @ApiProperty({ example: '102', nullable: true })
  @Column({
    name: 'fiscal_icms_csosn',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  fiscalIcmsCsosn?: string | null;

  @ApiProperty({ example: '49', nullable: true })
  @Column({ name: 'fiscal_pis_cst', type: 'varchar', length: 10, nullable: true })
  fiscalPisCst?: string | null;

  @ApiProperty({ example: '49', nullable: true })
  @Column({
    name: 'fiscal_cofins_cst',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  fiscalCofinsCst?: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'fiscal_is_billable', type: 'boolean', default: true })
  fiscalIsBillable: boolean;

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
