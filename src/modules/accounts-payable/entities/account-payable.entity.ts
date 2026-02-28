import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @ApiProperty({ example: '2024-07-10T14:00:00Z', nullable: true })
  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date | null;

  @ApiProperty({ example: 'PENDING' })
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

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
