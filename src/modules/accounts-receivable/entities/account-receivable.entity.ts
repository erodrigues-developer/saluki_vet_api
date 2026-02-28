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
import { Client } from '../../clients/entities/client.entity';

@Entity({ name: 'accounts_receivable' })
export class AccountReceivable {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'sale_id', type: 'bigint', nullable: true })
  saleId?: number | null;

  @ManyToOne(() => Sale)
  @JoinColumn({ name: 'sale_id' })
  sale?: Sale;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'client_id', type: 'bigint', nullable: true })
  clientId?: number | null;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client?: Client;

  @ApiProperty({ example: 'Fatura 001' })
  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ApiProperty({ example: 250.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: '2024-07-15' })
  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @ApiProperty({ example: '2024-07-10T14:00:00Z', nullable: true })
  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date | null;

  @ApiProperty({ example: 'PENDING' })
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
