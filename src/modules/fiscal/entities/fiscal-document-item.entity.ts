import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SaleItem } from '../../sale-items/entities/sale-item.entity';
import { FiscalDocument } from './fiscal-document.entity';

@Entity({ name: 'fiscal_document_items' })
export class FiscalDocumentItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'fiscal_document_id', type: 'bigint' })
  fiscalDocumentId: number;

  @ManyToOne(() => FiscalDocument, (document) => document.items)
  @JoinColumn({ name: 'fiscal_document_id' })
  fiscalDocument: FiscalDocument;

  @Column({ name: 'sale_item_id', type: 'bigint', nullable: true })
  saleItemId?: number | null;

  @ManyToOne(() => SaleItem, { nullable: true })
  @JoinColumn({ name: 'sale_item_id' })
  saleItem?: SaleItem | null;

  @Column({ name: 'source_entity_type', type: 'varchar', length: 30 })
  sourceEntityType: string;

  @Column({ name: 'source_entity_id', type: 'bigint', nullable: true })
  sourceEntityId?: number | null;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ncm?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cest?: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  cfop?: string | null;

  @Column({ name: 'service_code', type: 'varchar', length: 50, nullable: true })
  serviceCode?: string | null;

  @Column({ name: 'lc116_code', type: 'varchar', length: 20, nullable: true })
  lc116Code?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @Column({ name: 'commercial_unit', type: 'varchar', length: 20, nullable: true })
  commercialUnit?: string | null;

  @Column({ name: 'tax_unit', type: 'varchar', length: 20, nullable: true })
  taxUnit?: string | null;

  @Column({ name: 'unit_amount', type: 'decimal', precision: 12, scale: 2 })
  unitAmount: number;

  @Column({ name: 'gross_amount', type: 'decimal', precision: 12, scale: 2 })
  grossAmount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ name: 'tax_snapshot_json', type: 'jsonb' })
  taxSnapshotJson: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
