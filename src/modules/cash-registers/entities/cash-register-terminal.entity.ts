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
import { ThermalPrinter } from './thermal-printer.entity';

@Entity({ name: 'cash_register_terminals' })
export class CashRegisterTerminal {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'Caixa Recepção 01' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: 'RECEPTION_01' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ example: 'Terminal do balcão principal', nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'default_printer_id', type: 'bigint', nullable: true })
  defaultPrinterId?: number | null;

  @ManyToOne(() => ThermalPrinter, { nullable: true })
  @JoinColumn({ name: 'default_printer_id' })
  defaultPrinter?: ThermalPrinter | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
