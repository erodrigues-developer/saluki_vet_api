import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FiscalDocument } from './fiscal-document.entity';

@Entity({ name: 'fiscal_document_files' })
export class FiscalDocumentFile {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'fiscal_document_id', type: 'bigint' })
  fiscalDocumentId: number;

  @ManyToOne(() => FiscalDocument, (document) => document.files)
  @JoinColumn({ name: 'fiscal_document_id' })
  fiscalDocument: FiscalDocument;

  @Column({ name: 'file_type', type: 'varchar', length: 50 })
  fileType: string;

  @Column({ name: 'storage_backend', type: 'varchar', length: 20 })
  storageBackend: string;

  @Column({ name: 'storage_path', type: 'varchar', length: 700 })
  storagePath: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  checksum?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
