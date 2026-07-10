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
import { ExamRequest } from '../../exam-requests/entities/exam-request.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'exam_results' })
export class ExamResult {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'exam_request_id', type: 'bigint' })
  examRequestId: number;

  @ManyToOne(() => ExamRequest)
  @JoinColumn({ name: 'exam_request_id' })
  examRequest?: ExamRequest;

  @ApiProperty({ example: '{"leucocitos": 12000}', nullable: true })
  @Column({ name: 'result_data', type: 'text', nullable: true })
  resultData?: string | null;

  @ApiProperty({ example: 'https://cdn.exemplo/123.pdf', nullable: true })
  @Column({ name: 'file_url', type: 'varchar', length: 500, nullable: true })
  fileUrl?: string | null;

  @ApiProperty({ example: 'exam-results/123.pdf', nullable: true })
  @Column({ name: 'storage_key', type: 'varchar', length: 500, nullable: true })
  storageKey?: string | null;

  @ApiProperty({ example: 'hemograma.pdf', nullable: true })
  @Column({ name: 'original_name', type: 'varchar', length: 255, nullable: true })
  originalName?: string | null;

  @ApiProperty({ example: 'application/pdf', nullable: true })
  @Column({ name: 'mime_type', type: 'varchar', length: 150, nullable: true })
  mimeType?: string | null;

  @ApiProperty({ example: 254000, nullable: true })
  @Column({ name: 'file_size', type: 'int', nullable: true })
  fileSize?: number | null;

  @ApiProperty({ example: 'Arquivo conferido pela equipe.', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: '2024-07-09T15:00:00Z' })
  @Column({ name: 'completed_at', type: 'timestamp' })
  completedAt: Date;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'veterinarian_id', type: 'bigint', nullable: true })
  veterinarianId?: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian?: User;

  @ApiProperty({ example: '2026-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-09T13:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
