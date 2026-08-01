import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FiscalProfile } from './fiscal-profile.entity';

@Entity({ name: 'fiscal_document_sequences' })
export class FiscalDocumentSequence {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'fiscal_profile_id', type: 'bigint' })
  fiscalProfileId: number;

  @ManyToOne(() => FiscalProfile, (profile) => profile.sequences)
  @JoinColumn({ name: 'fiscal_profile_id' })
  fiscalProfile: FiscalProfile;

  @Column({ name: 'document_type', type: 'varchar', length: 20 })
  documentType: string;

  @Column({ type: 'varchar', length: 20 })
  environment: string;

  @Column({ type: 'int' })
  series: number;

  @Column({ name: 'current_number', type: 'int', default: 0 })
  currentNumber: number;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
