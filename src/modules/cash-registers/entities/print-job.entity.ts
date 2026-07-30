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
import { CashRegisterSession } from './cash-register-session.entity';
import { CashRegisterTerminal } from './cash-register-terminal.entity';
import { ThermalPrinter } from './thermal-printer.entity';

@Entity({ name: 'print_jobs' })
export class PrintJob {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'printer_id', type: 'bigint', nullable: true })
  printerId?: number | null;

  @ManyToOne(() => ThermalPrinter, { nullable: true })
  @JoinColumn({ name: 'printer_id' })
  printer?: ThermalPrinter | null;

  @Column({ name: 'terminal_id', type: 'bigint', nullable: true })
  terminalId?: number | null;

  @ManyToOne(() => CashRegisterTerminal, { nullable: true })
  @JoinColumn({ name: 'terminal_id' })
  terminal?: CashRegisterTerminal | null;

  @Column({ name: 'cash_register_session_id', type: 'bigint', nullable: true })
  cashRegisterSessionId?: number | null;

  @ManyToOne(() => CashRegisterSession, { nullable: true })
  @JoinColumn({ name: 'cash_register_session_id' })
  cashRegisterSession?: CashRegisterSession | null;

  @Column({ name: 'sale_id', type: 'bigint', nullable: true })
  saleId?: number | null;

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'sale_id' })
  sale?: Sale | null;

  @Column({ name: 'fiscal_document_id', type: 'bigint', nullable: true })
  fiscalDocumentId?: number | null;

  @Column({ type: 'varchar', length: 30 })
  type: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @Column({ type: 'int', default: 1 })
  copies: number;

  @Column({ name: 'payload_json', type: 'jsonb' })
  payloadJson: Record<string, any>;

  @Column({ name: 'rendered_content', type: 'text', nullable: true })
  renderedContent?: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ name: 'requested_by_user_id', type: 'bigint' })
  requestedByUserId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedByUser: User;

  @Column({ name: 'printed_at', type: 'timestamp', nullable: true })
  printedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
