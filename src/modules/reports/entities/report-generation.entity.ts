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

@Entity({ name: 'report_generations' })
export class ReportGeneration {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'REVENUE_BY_PERIOD' })
  @Column({ name: 'report_type', type: 'varchar', length: 50 })
  reportType: string;

  @ApiProperty({ example: 1 })
  @Column({ name: 'requested_by_user_id', type: 'bigint' })
  requestedByUserId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedByUser: User;

  @ApiProperty({ type: Object })
  @Column({ name: 'filters_json', type: 'jsonb' })
  filtersJson: Record<string, unknown>;

  @ApiProperty({ example: 'http://localhost:3000/uploads/reports/file.xlsx' })
  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl: string;

  @ApiProperty({ example: 'reports/file.xlsx' })
  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  storageKey: string;

  @ApiProperty({ example: 'relatorio-faturamento.xlsx' })
  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @ApiProperty({
    example:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType: string;

  @ApiProperty({ example: 10240 })
  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @ApiProperty({ example: 'GENERATED' })
  @Column({ type: 'varchar', length: 20, default: 'GENERATED' })
  status: string;

  @ApiProperty({ example: 125, nullable: true })
  @Column({ name: 'row_count', type: 'int', nullable: true })
  rowCount?: number | null;

  @ApiProperty({ example: null, nullable: true })
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @ApiProperty({ example: 284, nullable: true })
  @Column({ name: 'generation_time_ms', type: 'int', nullable: true })
  generationTimeMs?: number | null;

  @ApiProperty({ example: '2026-07-13T12:00:00Z' })
  @Column({ name: 'generated_at', type: 'timestamp' })
  generatedAt: Date;

  @ApiProperty({ example: '2026-07-13T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-13T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
