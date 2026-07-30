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
import { CashRegisterTerminal } from './cash-register-terminal.entity';

@Entity({ name: 'cash_register_sessions' })
export class CashRegisterSession {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'terminal_id', type: 'bigint' })
  terminalId: number;

  @ManyToOne(() => CashRegisterTerminal)
  @JoinColumn({ name: 'terminal_id' })
  terminal: CashRegisterTerminal;

  @Column({ name: 'opened_by_user_id', type: 'bigint' })
  openedByUserId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'opened_by_user_id' })
  openedByUser: User;

  @Column({ name: 'closed_by_user_id', type: 'bigint', nullable: true })
  closedByUserId?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'closed_by_user_id' })
  closedByUser?: User | null;

  @Column({ type: 'varchar', length: 20, default: 'OPEN' })
  status: string;

  @Column({ name: 'opened_at', type: 'timestamp' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt?: Date | null;

  @Column({
    name: 'opening_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  openingAmount: number;

  @Column({
    name: 'expected_cash_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  expectedCashAmount: number;

  @Column({
    name: 'declared_cash_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  declaredCashAmount?: number | null;

  @Column({
    name: 'cash_difference',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  cashDifference?: number | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'closing_notes', type: 'text', nullable: true })
  closingNotes?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
