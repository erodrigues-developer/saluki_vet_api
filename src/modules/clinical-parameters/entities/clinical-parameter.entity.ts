import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InpatientRecord } from '../../inpatient-records/entities/inpatient-record.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'clinical_parameters' })
export class ClinicalParameter {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'inpatient_record_id', type: 'bigint' })
  inpatientRecordId: number;

  @ManyToOne(() => InpatientRecord)
  @JoinColumn({ name: 'inpatient_record_id' })
  inpatientRecord?: InpatientRecord;

  @ApiProperty({ example: '2024-07-09T14:30:00Z' })
  @Column({ name: 'measured_at', type: 'timestamp' })
  measuredAt: Date;

  @ApiProperty({ example: 38.5, nullable: true })
  @Column({
    name: 'temperature_c',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  temperatureC?: number | null;

  @ApiProperty({ example: 120, nullable: true })
  @Column({ name: 'heart_rate_bpm', type: 'int', nullable: true })
  heartRateBpm?: number | null;

  @ApiProperty({ example: 30, nullable: true })
  @Column({ name: 'respiratory_rate_mpm', type: 'int', nullable: true })
  respiratoryRateMpm?: number | null;

  @ApiProperty({ example: '120/80', nullable: true })
  @Column({
    name: 'blood_pressure',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  bloodPressure?: string | null;

  @ApiProperty({ example: 10.5, nullable: true })
  @Column({
    name: 'weight_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  weightKg?: number | null;

  @ApiProperty({ example: 'Animal alerta', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
  createdByUserId?: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: User;
}
