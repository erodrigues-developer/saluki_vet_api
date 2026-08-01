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
import { Sale } from '../../sales/entities/sale.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';
import { CashRegisterSession } from '../../cash-registers/entities/cash-register-session.entity';

@Entity({ name: 'payments' })
export class Payment {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'sale_id', type: 'bigint' })
  saleId: number;

  @ManyToOne(() => Sale, (sale) => sale.payments)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ApiProperty({ example: 1 })
  @Column({ name: 'payment_method_id', type: 'bigint' })
  paymentMethodId: number;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'cash_register_session_id', type: 'bigint', nullable: true })
  cashRegisterSessionId?: number | null;

  @ManyToOne(() => CashRegisterSession, { nullable: true })
  @JoinColumn({ name: 'cash_register_session_id' })
  cashRegisterSession?: CashRegisterSession | null;

  @ApiProperty({ example: 150.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: 150.0, nullable: true })
  @Column({
    name: 'tendered_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tenderedAmount?: number | null;

  @ApiProperty({ example: 0.0, nullable: true })
  @Column({
    name: 'change_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  changeAmount?: number | null;

  @ApiProperty({ example: '17', nullable: true })
  @Column({
    name: 'fiscal_payment_type_code',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  fiscalPaymentTypeCode?: string | null;

  @ApiProperty({ example: '01', nullable: true })
  @Column({ name: 'card_brand_code', type: 'varchar', length: 10, nullable: true })
  cardBrandCode?: string | null;

  @ApiProperty({ example: 'INTEGRATED', nullable: true })
  @Column({ name: 'integration_type', type: 'varchar', length: 30, nullable: true })
  integrationType?: string | null;

  @ApiProperty({ example: '123456', nullable: true })
  @Column({ name: 'authorization_code', type: 'varchar', length: 100, nullable: true })
  authorizationCode?: string | null;

  @ApiProperty({ example: '00000000000000', nullable: true })
  @Column({ name: 'acquirer_cnpj', type: 'varchar', length: 20, nullable: true })
  acquirerCnpj?: string | null;

  @ApiProperty({ example: '2024-07-20T10:00:00Z' })
  @Column({ name: 'paid_at', type: 'timestamp' })
  paidAt: Date;

  @ApiProperty({ example: 'Pago em 2x', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
