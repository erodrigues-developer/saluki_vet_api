import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { User } from '../../users/entities/user.entity';
import { AccountPayable } from './account-payable.entity';

@Entity({ name: 'account_payable_recurrences' })
export class AccountPayableRecurrence {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'Aluguel da clínica' })
  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ApiPropertyOptional({ example: 'Custos Fixos' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string | null;

  @ApiProperty({ example: 2500 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiPropertyOptional({ example: 1 })
  @Column({ name: 'supplier_id', type: 'bigint', nullable: true })
  supplierId?: number | null;

  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Supplier | null;

  @ApiPropertyOptional({ example: 7 })
  @Column({ name: 'beneficiary_user_id', type: 'bigint', nullable: true })
  beneficiaryUserId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'beneficiary_user_id' })
  beneficiaryUser?: User | null;

  @ApiProperty({ example: 'MONTHLY' })
  @Column({ type: 'varchar', length: 20 })
  frequency: string;

  @ApiProperty({ example: 1 })
  @Column({ name: 'interval_count', type: 'int', default: 1 })
  intervalCount: number;

  @ApiProperty({ example: '2026-07-10' })
  @Column({ name: 'first_due_date', type: 'date' })
  firstDueDate: Date;

  @ApiPropertyOptional({ example: '2027-07-10' })
  @Column({ name: 'ends_at', type: 'date', nullable: true })
  endsAt?: Date | null;

  @ApiPropertyOptional({ example: 12 })
  @Column({ name: 'occurrences_limit', type: 'int', nullable: true })
  occurrencesLimit?: number | null;

  @ApiProperty({ example: '2026-08-10' })
  @Column({ name: 'next_due_date', type: 'date' })
  nextDueDate: Date;

  @ApiPropertyOptional({ example: '2026-07-10' })
  @Column({ name: 'last_generated_due_date', type: 'date', nullable: true })
  lastGeneratedDueDate?: Date | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'Mensalidade com reajuste anual.' })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({ example: 'MANUAL' })
  @Column({ name: 'origin_type', type: 'varchar', length: 30, default: 'MANUAL' })
  originType: string;

  @ApiPropertyOptional({ example: 42 })
  @Column({ name: 'origin_reference_id', type: 'bigint', nullable: true })
  originReferenceId?: number | null;

  @OneToMany(() => AccountPayable, (accountPayable) => accountPayable.recurrence)
  generatedAccounts?: AccountPayable[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
