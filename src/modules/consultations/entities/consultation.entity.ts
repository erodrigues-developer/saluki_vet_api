import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ConsultationRecordStatus = 'DRAFT' | 'FINALIZED';

export type ConsultationAiReviewAction =
  | 'pending'
  | 'confirmed'
  | 'edited'
  | 'discarded';

export interface ConsultationAiReviewAuditItem {
  blockType: 'anamnesis';
  aiSuggestedText: string | null;
  finalText: string | null;
  action: ConsultationAiReviewAction;
  userId?: number | null;
  timestamp: string;
}

@Entity({ name: 'consultations' })
export class Consultation {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'appointment_id', type: 'bigint', nullable: true })
  appointmentId?: number | null;

  @ApiProperty({ example: 1 })
  @Column({ name: 'pet_id', type: 'bigint' })
  petId: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'client_id', type: 'bigint' })
  clientId: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'veterinarian_id', type: 'bigint' })
  veterinarianId: number;

  @ApiProperty({ example: '2024-07-20T10:00:00Z' })
  @Column({ name: 'visit_date', type: 'timestamp' })
  visitDate: Date;

  @ApiProperty({ example: 5.5, nullable: true })
  @Column({
    name: 'weight_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  weightKg?: number | null;

  @ApiProperty({ example: 38.5, nullable: true })
  @Column({
    name: 'temperature_c',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  temperatureC?: number | null;

  @ApiProperty({ example: 'Vômito há 2 dias', nullable: true })
  @Column({ name: 'main_complaint', type: 'text', nullable: true })
  mainComplaint?: string | null;

  @ApiProperty({ example: 'Tutor relata vômitos e prostração', nullable: true })
  @Column({ name: 'original_complaint', type: 'text', nullable: true })
  originalComplaint?: string | null;

  @ApiProperty({
    example: 'Paciente com prostração aguda e episódios de vômito',
    nullable: true,
  })
  @Column({ name: 'ai_organized_complaint', type: 'text', nullable: true })
  aiOrganizedComplaint?: string | null;

  @ApiProperty({
    example: 'Resumo clínico assistido da anamnese',
    nullable: true,
  })
  @Column({ name: 'assisted_anamnesis_summary', type: 'text', nullable: true })
  assistedAnamnesisSummary?: string | null;

  @ApiProperty({ example: false })
  @Column({
    name: 'anamnesis_approved',
    type: 'boolean',
    default: false,
  })
  anamnesisApproved: boolean;

  @ApiProperty({ example: '2026-05-23T12:00:00.000Z', nullable: true })
  @Column({ name: 'anamnesis_approved_at', type: 'timestamp', nullable: true })
  anamnesisApprovedAt?: Date | null;

  @ApiProperty({ example: 12, nullable: true })
  @Column({
    name: 'anamnesis_approved_by_user_id',
    type: 'bigint',
    nullable: true,
  })
  anamnesisApprovedByUserId?: number | null;

  @ApiProperty({ nullable: true })
  @Column({ name: 'consultive_support_text', type: 'text', nullable: true })
  consultiveSupportText?: string | null;

  @ApiProperty({ example: '2026-05-23T12:00:00.000Z', nullable: true })
  @Column({
    name: 'consultive_support_generated_at',
    type: 'timestamp',
    nullable: true,
  })
  consultiveSupportGeneratedAt?: Date | null;

  @ApiProperty({ example: 'Desidratação leve', nullable: true })
  @Column({ name: 'clinical_findings', type: 'text', nullable: true })
  clinicalFindings?: string | null;

  @ApiProperty({ example: 'Gastrite', nullable: true })
  @Column({ type: 'text', nullable: true })
  diagnosis?: string | null;

  @ApiProperty({ example: 'Soro + Antiemético', nullable: true })
  @Column({ name: 'treatment_plan', type: 'text', nullable: true })
  treatmentPlan?: string | null;

  @ApiProperty({ example: 'Retorno em 5 dias', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: false })
  @Column({
    name: 'migrated_from_legacy_flow',
    type: 'boolean',
    default: false,
  })
  migratedFromLegacyFlow: boolean;

  @ApiProperty({ example: 'DRAFT' })
  @Column({ name: 'record_status', type: 'varchar', length: 20, default: 'DRAFT' })
  recordStatus: ConsultationRecordStatus;

  @ApiProperty({ nullable: true, type: 'array' })
  @Column({ name: 'ai_review_audit', type: 'jsonb', nullable: true })
  aiReviewAudit?: ConsultationAiReviewAuditItem[] | null;

  @ApiProperty({ example: '2026-05-22T10:30:00.000Z', nullable: true })
  @Column({ name: 'finalized_at', type: 'timestamp', nullable: true })
  finalizedAt?: Date | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
