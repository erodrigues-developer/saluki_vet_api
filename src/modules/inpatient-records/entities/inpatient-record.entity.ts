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
import { Pet } from '../../pets/entities/pet.entity';
import { Box } from '../../boxes/entities/box.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';

@Entity({ name: 'inpatient_records' })
export class InpatientRecord {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'pet_id', type: 'bigint' })
  petId: number;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'pet_id' })
  pet?: Pet;

  @ApiProperty({ example: 1 })
  @Column({ name: 'box_id', type: 'bigint' })
  boxId: number;

  @ManyToOne(() => Box)
  @JoinColumn({ name: 'box_id' })
  box?: Box;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'consultation_id', type: 'bigint', nullable: true })
  consultationId?: number | null;

  @ManyToOne(() => Consultation)
  @JoinColumn({ name: 'consultation_id' })
  consultation?: Consultation;

  @ApiProperty({ example: 'Cirurgia ortopédica', nullable: true })
  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @Column({ name: 'admission_at', type: 'timestamp' })
  admissionAt: Date;

  @ApiProperty({ example: '2024-07-12T12:00:00Z', nullable: true })
  @Column({ name: 'discharge_at', type: 'timestamp', nullable: true })
  dischargeAt?: Date | null;

  @ApiProperty({ example: 'ACTIVE' })
  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 'Observar alimentação', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
