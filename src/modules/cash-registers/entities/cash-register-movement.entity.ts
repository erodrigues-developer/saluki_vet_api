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
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';
import { CashRegisterSession } from './cash-register-session.entity';
import { CashRegisterTerminal } from './cash-register-terminal.entity';

@Entity({ name: 'cash_register_movements' })
export class CashRegisterMovement {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'session_id', type: 'bigint' })
  sessionId: number;

  @ManyToOne(() => CashRegisterSession)
  @JoinColumn({ name: 'session_id' })
  session: CashRegisterSession;

  @Column({ name: 'terminal_id', type: 'bigint' })
  terminalId: number;

  @ManyToOne(() => CashRegisterTerminal)
  @JoinColumn({ name: 'terminal_id' })
  terminal: CashRegisterTerminal;

  @Column({ type: 'varchar', length: 30 })
  type: string;

  @Column({ type: 'varchar', length: 10 })
  direction: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'payment_method_id', type: 'bigint', nullable: true })
  paymentMethodId?: number | null;

  @ManyToOne(() => PaymentMethod, { nullable: true })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod?: PaymentMethod | null;

  @Column({ name: 'sale_id', type: 'bigint', nullable: true })
  saleId?: number | null;

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'sale_id' })
  sale?: Sale | null;

  @Column({ name: 'payment_id', type: 'bigint', nullable: true })
  paymentId?: number | null;

  @ManyToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment?: Payment | null;

  @Column({ name: 'created_by_user_id', type: 'bigint' })
  createdByUserId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User;

  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
