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
import { Procedure } from '../../procedures/entities/procedure.entity';

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
  @Column({ name: 'product_id', type: 'bigint', nullable: true })
  productId?: number | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product | null;

  @ApiProperty({ example: 1, required: false, nullable: true })
  @Column({ name: 'stock_location_id', type: 'bigint', nullable: true })
  stockLocationId?: number | null;

  @ApiProperty({ example: 1, required: false, nullable: true })
  @Column({ name: 'procedure_id', type: 'bigint', nullable: true })
  procedureId?: number | null;

  @ManyToOne(() => Procedure, { nullable: true })
  @JoinColumn({ name: 'procedure_id' })
  procedure?: Procedure | null;

  @ApiProperty({ example: 1 })
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 1 })
  quantity: number;

  @ApiProperty({ example: 150.0 })
  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty({ example: 10.0 })
  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountAmount: number;

  @ApiProperty({ example: 140.0 })
  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @ApiProperty({ example: 'CONSULTATION_PROCEDURE', nullable: true })
  @Column({ name: 'origin_type', type: 'varchar', length: 50, nullable: true })
  originType?: string | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'origin_reference_id', type: 'bigint', nullable: true })
  originReferenceId?: number | null;

  @ApiProperty({ example: 'PRODUCT', nullable: true })
  @Column({ name: 'fiscal_group', type: 'varchar', length: 20, nullable: true })
  fiscalGroup?: string | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'fiscal_document_id', type: 'bigint', nullable: true })
  fiscalDocumentId?: number | null;

  @ApiProperty({ example: 'PENDING_ISSUE', nullable: true })
  @Column({ name: 'fiscal_status', type: 'varchar', length: 50, nullable: true })
  fiscalStatus?: string | null;
}
