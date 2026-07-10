import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';

@Entity({ name: 'accounts_payable' })
export class AccountPayable {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'Conta de energia' })
  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ApiProperty({ example: 'Custos Fixos', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string | null;

  @ApiProperty({ example: 150.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: '2024-07-15' })
  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'supplier_id', type: 'bigint', nullable: true })
  supplierId?: number | null;

  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplier_id' })
  @ApiProperty({
    type: () => Supplier,
    required: false,
    nullable: true,
    description: 'Fornecedor vinculado',
  })
  supplier?: Supplier | null;

  @ApiProperty({ example: 7, nullable: true })
  @Column({ name: 'beneficiary_user_id', type: 'bigint', nullable: true })
  beneficiaryUserId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'beneficiary_user_id' })
  @ApiProperty({
    type: () => User,
    required: false,
    nullable: true,
    description: 'Profissional beneficiário quando a conta tem origem em comissão',
  })
  beneficiaryUser?: User | null;

  @ApiProperty({ example: 150.5, nullable: true })
  @Column({
    name: 'paid_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  paidAmount?: number | null;

  @ApiProperty({ example: 'PIX', nullable: true })
  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod?: string | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'payment_method_id', type: 'bigint', nullable: true })
  paymentMethodId?: number | null;

  @ManyToOne(() => PaymentMethod, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethodRelation?: PaymentMethod | null;

  @ApiProperty({ example: 'https://s3.../doc.pdf', nullable: true })
  @Column({
    name: 'document_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  documentUrl?: string | null;

  @ApiProperty({ example: '2024-07-10T14:00:00Z', nullable: true })
  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date | null;

  @ApiProperty({ example: 'PENDING' })
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @ApiProperty({ example: 'COMMISSION_PAYOUT' })
  @Column({ name: 'origin_type', type: 'varchar', length: 30, default: 'MANUAL' })
  originType: string;

  @ApiProperty({ example: 42, nullable: true })
  @Column({ name: 'origin_reference_id', type: 'bigint', nullable: true })
  originReferenceId?: number | null;

  @ApiProperty({ example: 'Multa de 2%', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
