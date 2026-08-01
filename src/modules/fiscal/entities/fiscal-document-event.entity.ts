import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FiscalDocument } from './fiscal-document.entity';

@Entity({ name: 'fiscal_document_events' })
export class FiscalDocumentEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'fiscal_document_id', type: 'bigint' })
  fiscalDocumentId: number;

  @ManyToOne(() => FiscalDocument, (document) => document.events)
  @JoinColumn({ name: 'fiscal_document_id' })
  fiscalDocument: FiscalDocument;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType: string;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ name: 'protocol_number', type: 'varchar', length: 80, nullable: true })
  protocolNumber?: string | null;

  @Column({ type: 'text', nullable: true })
  justification?: string | null;

  @Column({ name: 'payload_json', type: 'jsonb', nullable: true })
  payloadJson?: Record<string, unknown> | null;

  @Column({ name: 'response_json', type: 'jsonb', nullable: true })
  responseJson?: Record<string, unknown> | null;

  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
