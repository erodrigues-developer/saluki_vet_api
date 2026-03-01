import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'accounts_payable' })
  @Column({ name: 'entity_name', type: 'varchar', length: 100 })
  entityName: string;

  @ApiProperty({ example: 123 })
  @Column({ name: 'record_id', type: 'bigint' })
  recordId: number;

  @ApiProperty({ example: 'UPDATE' })
  @Column({ type: 'varchar', length: 20 })
  action: string;

  @ApiProperty({ example: '{"status": "PENDING"}', nullable: true })
  @Column({ name: 'old_values', type: 'text', nullable: true })
  oldValues?: string | null;

  @ApiProperty({ example: '{"status": "PAID"}', nullable: true })
  @Column({ name: 'new_values', type: 'text', nullable: true })
  newValues?: string | null;

  @ApiProperty({ example: 42, nullable: true })
  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId?: number | null;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
