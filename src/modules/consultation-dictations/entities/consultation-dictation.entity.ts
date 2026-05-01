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
import { Consultation } from '../../consultations/entities/consultation.entity';
import { User } from '../../users/entities/user.entity';

export type ConsultationDictationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type ConsultationDictationCaptureSource =
  | 'MANUAL_TEXT'
  | 'BROWSER_AUDIO'
  | 'BROWSER_SPEECH';

export interface ConsultationDictationStructuredPayload {
  summary: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  mainComplaint: string | null;
  clinicalFindings: string | null;
  diagnosis: string | null;
  treatmentPlan: string | null;
  notes: string | null;
  weightKg: number | null;
  temperatureC: number | null;
  keywords: string[];
}

@Entity({ name: 'consultation_dictations' })
export class ConsultationDictation {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 12 })
  @Column({ name: 'consultation_id', type: 'bigint' })
  consultationId: number;

  @ManyToOne(() => Consultation)
  @JoinColumn({ name: 'consultation_id' })
  consultation?: Consultation;

  @ApiProperty({ example: 4, nullable: true })
  @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
  createdByUserId?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: User | null;

  @ApiProperty({ example: 'PENDING' })
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: ConsultationDictationStatus;

  @ApiProperty({ example: 'BROWSER_AUDIO' })
  @Column({
    name: 'capture_source',
    type: 'varchar',
    length: 30,
    default: 'MANUAL_TEXT',
  })
  captureSource: ConsultationDictationCaptureSource;

  @ApiProperty({ example: 'pt-BR' })
  @Column({ type: 'varchar', length: 20, default: 'pt-BR' })
  language: string;

  @ApiProperty({ example: 95, nullable: true })
  @Column({ name: 'audio_duration_seconds', type: 'int', nullable: true })
  audioDurationSeconds?: number | null;

  @ApiProperty({ example: 'consulta-7-1712335523.webm', nullable: true })
  @Column({
    name: 'audio_file_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  audioFileName?: string | null;

  @ApiProperty({ example: 'audio/webm', nullable: true })
  @Column({
    name: 'audio_mime_type',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  audioMimeType?: string | null;

  @Column({
    name: 'audio_blob',
    type: 'bytea',
    nullable: true,
    select: false,
  })
  audioBlob?: Buffer | null;

  @ApiProperty({ example: 'Tutor relata vomito desde ontem...' })
  @Column({ name: 'transcript_draft', type: 'text' })
  transcriptDraft: string;

  @ApiProperty({
    example: 'Tutor relata vômito desde ontem...',
    nullable: true,
  })
  @Column({ name: 'transcript_final', type: 'text', nullable: true })
  transcriptFinal?: string | null;

  @ApiProperty({
    example: {
      summary: 'Gastroenterite leve com boa resposta ao manejo sintomatico.',
      mainComplaint: 'Vomito e apatia desde ontem.',
      clinicalFindings: 'Temperatura 39,4C e desidratacao discreta.',
      diagnosis: 'Suspeita de gastroenterite aguda.',
      treatmentPlan: 'Dieta leve, antiemetico e retorno em 48h.',
      notes: 'Orientado tutor sobre sinais de alerta.',
      weightKg: 5.2,
      temperatureC: 39.4,
      keywords: ['vomito', 'apatia', 'gastroenterite'],
    },
    nullable: true,
  })
  @Column({ name: 'structured_payload', type: 'jsonb', nullable: true })
  structuredPayload?: ConsultationDictationStructuredPayload | null;

  @ApiProperty({ example: 'Transcript draft vazio', nullable: true })
  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string | null;

  @ApiProperty({ example: 1 })
  @Column({ name: 'processing_attempts', type: 'int', default: 0 })
  processingAttempts: number;

  @ApiProperty({ example: '2026-04-05T10:30:00.000Z', nullable: true })
  @Column({ name: 'processing_started_at', type: 'timestamp', nullable: true })
  processingStartedAt?: Date | null;

  @ApiProperty({ example: '2026-04-05T10:30:05.000Z', nullable: true })
  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date | null;

  @ApiProperty({ example: '2026-04-05T10:29:10.000Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-05T10:30:05.000Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
