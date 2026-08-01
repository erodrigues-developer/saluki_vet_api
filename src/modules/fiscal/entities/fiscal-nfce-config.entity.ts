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

@Entity({ name: 'fiscal_nfce_configs' })
export class FiscalNfceConfig {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'fiscal_profile_id', type: 'bigint' })
  fiscalProfileId: number;

  @ManyToOne(() => FiscalProfile, (profile) => profile.nfceConfigs)
  @JoinColumn({ name: 'fiscal_profile_id' })
  fiscalProfile: FiscalProfile;

  @Column({ type: 'varchar', length: 20 })
  environment: string;

  @Column({ type: 'int' })
  series: number;

  @Column({ name: 'csc_id', type: 'varchar', length: 20 })
  cscId: string;

  @Column({ name: 'encrypted_csc', type: 'text' })
  encryptedCsc: string;

  @Column({ name: 'contingency_enabled', type: 'boolean', default: false })
  contingencyEnabled: boolean;

  @Column({ name: 'contingency_alert_after_minutes', type: 'int', default: 60 })
  contingencyAlertAfterMinutes: number;

  @Column({ name: 'contingency_critical_after_minutes', type: 'int', default: 720 })
  contingencyCriticalAfterMinutes: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
