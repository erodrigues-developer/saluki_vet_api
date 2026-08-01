import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { FiscalProfile } from './fiscal-profile.entity';
import { FiscalDocumentItem } from './fiscal-document-item.entity';
import { FiscalDocumentEvent } from './fiscal-document-event.entity';
import { FiscalDocumentFile } from './fiscal-document-file.entity';

@Entity({ name: 'fiscal_documents' })
export class FiscalDocument {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'sale_id', type: 'bigint', nullable: true })
  saleId?: number | null;

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'sale_id' })
  sale?: Sale | null;

  @Column({ name: 'source_type', type: 'varchar', length: 30, default: 'SALE' })
  sourceType: string;

  @Column({ name: 'document_type', type: 'varchar', length: 20 })
  documentType: string;

  @Column({ name: 'fiscal_profile_id', type: 'bigint' })
  fiscalProfileId: number;

  @ManyToOne(() => FiscalProfile, (profile) => profile.documents)
  @JoinColumn({ name: 'fiscal_profile_id' })
  fiscalProfile: FiscalProfile;

  @Column({ name: 'client_id', type: 'bigint', nullable: true })
  clientId?: number | null;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client?: Client | null;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'varchar', length: 20 })
  environment: string;

  @Column({ type: 'int' })
  series: number;

  @Column({ type: 'int' })
  number: number;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 255, unique: true })
  idempotencyKey: string;

  @Column({ name: 'rps_number', type: 'varchar', length: 50, nullable: true })
  rpsNumber?: string | null;

  @Column({ name: 'verification_code', type: 'varchar', length: 100, nullable: true })
  verificationCode?: string | null;

  @Column({ name: 'access_key', type: 'varchar', length: 80, nullable: true })
  accessKey?: string | null;

  @Column({ name: 'protocol_number', type: 'varchar', length: 80, nullable: true })
  protocolNumber?: string | null;

  @Column({ name: 'municipal_protocol', type: 'varchar', length: 100, nullable: true })
  municipalProtocol?: string | null;

  @Column({ name: 'issued_at', type: 'timestamp', nullable: true })
  issuedAt?: Date | null;

  @Column({ name: 'authorized_at', type: 'timestamp', nullable: true })
  authorizedAt?: Date | null;

  @Column({ name: 'canceled_at', type: 'timestamp', nullable: true })
  canceledAt?: Date | null;

  @Column({ name: 'contingency_mode', type: 'varchar', length: 50, nullable: true })
  contingencyMode?: string | null;

  @Column({ name: 'total_products_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalProductsAmount: number;

  @Column({ name: 'total_services_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalServicesAmount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'raw_request_json', type: 'jsonb', nullable: true })
  rawRequestJson?: Record<string, unknown> | null;

  @Column({ name: 'raw_response_json', type: 'jsonb', nullable: true })
  rawResponseJson?: Record<string, unknown> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @OneToMany(() => FiscalDocumentItem, (item) => item.fiscalDocument)
  items: FiscalDocumentItem[];

  @OneToMany(() => FiscalDocumentEvent, (event) => event.fiscalDocument)
  events: FiscalDocumentEvent[];

  @OneToMany(() => FiscalDocumentFile, (file) => file.fiscalDocument)
  files: FiscalDocumentFile[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
