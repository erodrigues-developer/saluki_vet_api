import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
  @Column({ name: 'weight_kg', type: 'decimal', precision: 10, scale: 2, nullable: true })
  weightKg?: number | null;

  @ApiProperty({ example: 38.5, nullable: true })
  @Column({ name: 'temperature_c', type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperatureC?: number | null;

  @ApiProperty({ example: 'Vômito há 2 dias', nullable: true })
  @Column({ name: 'main_complaint', type: 'text', nullable: true })
  mainComplaint?: string | null;

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

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
