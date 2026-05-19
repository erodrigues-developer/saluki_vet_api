import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppointmentType } from '../../appointment-types/entities/appointment-type.entity';
import { AppointmentStatus } from '../../appointment-statuses/entities/appointment-status.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'appointments' })
export class Appointment {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'pet_id', type: 'bigint' })
  petId: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'client_id', type: 'bigint' })
  clientId: number;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'veterinarian_id', type: 'bigint', nullable: true })
  veterinarianId?: number | null;

  @ApiProperty({ example: 1 })
  @Column({ name: 'appointment_type_id', type: 'bigint' })
  appointmentTypeId: number;

  @ManyToOne(() => AppointmentType)
  @JoinColumn({ name: 'appointment_type_id' })
  appointmentType: AppointmentType;

  @ApiProperty({ example: 1 })
  @Column({ name: 'status_id', type: 'bigint' })
  statusId: number;

  @ManyToOne(() => AppointmentStatus)
  @JoinColumn({ name: 'status_id' })
  status: AppointmentStatus;

  @ApiProperty({ example: '2024-07-20T10:00:00Z' })
  @Column({ name: 'starts_at', type: 'timestamp' })
  startsAt: Date;

  @ApiProperty({ example: '2024-07-20T10:30:00Z', nullable: true })
  @Column({ name: 'ends_at', type: 'timestamp', nullable: true })
  endsAt?: Date | null;

  @ApiProperty({ example: 'Vacina anual', nullable: true })
  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @ApiProperty({ example: 'Trazer carteirinha', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: 'AMARELA', nullable: true })
  @Column({ name: 'triage_risk', type: 'varchar', length: 20, nullable: true })
  triageRisk?: string | null;

  @ApiProperty({ example: 60, nullable: true })
  @Column({ name: 'triage_score', type: 'int', nullable: true })
  triageScore?: number | null;

  @ApiProperty({ example: 'Vomitos persistentes', nullable: true })
  @Column({ name: 'triage_notes', type: 'text', nullable: true })
  triageNotes?: string | null;

  @ApiProperty({ example: '2024-07-20T10:00:00Z', nullable: true })
  @Column({ name: 'arrived_at', type: 'timestamp', nullable: true })
  arrivedAt?: Date | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
  createdByUserId?: number | null;

  @ApiProperty({ example: 3, nullable: true })
  @Column({ name: 'checked_in_by_user_id', type: 'bigint', nullable: true })
  checkedInByUserId?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'checked_in_by_user_id' })
  checkedInByUser?: User | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;
}
