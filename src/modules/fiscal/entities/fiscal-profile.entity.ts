import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FiscalCertificateBinding } from './fiscal-certificate-binding.entity';
import { FiscalNfceConfig } from './fiscal-nfce-config.entity';
import { FiscalDocument } from './fiscal-document.entity';
import { FiscalDocumentSequence } from './fiscal-document-sequence.entity';

@Entity({ name: 'fiscal_profiles' })
export class FiscalProfile {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ name: 'trade_name', type: 'varchar', length: 255 })
  tradeName: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 255 })
  legalName: string;

  @Column({ type: 'varchar', length: 20 })
  cnpj: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cpf?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  ie?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  im?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cnae?: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  crt?: string | null;

  @Column({ name: 'tax_regime', type: 'varchar', length: 50, nullable: true })
  taxRegime?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  street?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  number?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complement?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  district?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  state?: string | null;

  @Column({ name: 'zip_code', type: 'varchar', length: 20, nullable: true })
  zipCode?: string | null;

  @Column({ name: 'ibge_city_code', type: 'varchar', length: 10, nullable: true })
  ibgeCityCode?: string | null;

  @Column({ name: 'country_code', type: 'varchar', length: 4, default: '1058' })
  countryCode: string;

  @Column({ name: 'fiscal_mode', type: 'varchar', length: 30, default: 'INATIVO' })
  fiscalMode: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => FiscalCertificateBinding, (item) => item.fiscalProfile)
  certificates: FiscalCertificateBinding[];

  @OneToMany(() => FiscalNfceConfig, (item) => item.fiscalProfile)
  nfceConfigs: FiscalNfceConfig[];

  @OneToMany(() => FiscalDocumentSequence, (item) => item.fiscalProfile)
  sequences: FiscalDocumentSequence[];

  @OneToMany(() => FiscalDocument, (item) => item.fiscalProfile)
  documents: FiscalDocument[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
