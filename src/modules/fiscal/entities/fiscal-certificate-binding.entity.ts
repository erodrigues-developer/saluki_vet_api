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

@Entity({ name: 'fiscal_certificate_bindings' })
export class FiscalCertificateBinding {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'fiscal_profile_id', type: 'bigint' })
  fiscalProfileId: number;

  @ManyToOne(() => FiscalProfile, (profile) => profile.certificates)
  @JoinColumn({ name: 'fiscal_profile_id' })
  fiscalProfile: FiscalProfile;

  @Column({ name: 'certificate_type', type: 'varchar', length: 10, default: 'A1' })
  certificateType: string;

  @Column({ name: 'storage_mode', type: 'varchar', length: 20, default: 'S3' })
  storageMode: string;

  @Column({ name: 's3_bucket', type: 'varchar', length: 255 })
  s3Bucket: string;

  @Column({ name: 's3_object_key', type: 'varchar', length: 500 })
  s3ObjectKey: string;

  @Column({ name: 's3_object_version', type: 'varchar', length: 255, nullable: true })
  s3ObjectVersion?: string | null;

  @Column({ name: 'encrypted_password', type: 'text' })
  encryptedPassword: string;

  @Column({ name: 'encryption_key_ref', type: 'varchar', length: 255, nullable: true })
  encryptionKeyRef?: string | null;

  @Column({ name: 'serial_number', type: 'varchar', length: 255, nullable: true })
  serialNumber?: string | null;

  @Column({ name: 'subject_name', type: 'varchar', length: 500, nullable: true })
  subjectName?: string | null;

  @Column({ name: 'issuer_name', type: 'varchar', length: 500, nullable: true })
  issuerName?: string | null;

  @Column({ name: 'valid_from', type: 'timestamp', nullable: true })
  validFrom?: Date | null;

  @Column({ name: 'valid_to', type: 'timestamp', nullable: true })
  validTo?: Date | null;

  @Column({ name: 'last_validation_at', type: 'timestamp', nullable: true })
  lastValidationAt?: Date | null;

  @Column({ name: 'cache_invalidation_token', type: 'varchar', length: 100, nullable: true })
  cacheInvalidationToken?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
