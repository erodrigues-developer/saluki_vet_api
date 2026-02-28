import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { ExamType } from '../../exam-types/entities/exam-type.entity';

@Entity({ name: 'exam_requests' })
export class ExamRequest {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'consultation_id', type: 'bigint', nullable: true })
  consultationId?: number | null;

  @ManyToOne(() => Consultation)
  @JoinColumn({ name: 'consultation_id' })
  consultation?: Consultation;

  @ApiProperty({ example: 1 })
  @Column({ name: 'pet_id', type: 'bigint' })
  petId: number;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'pet_id' })
  pet?: Pet;

  @ApiProperty({ example: 1 })
  @Column({ name: 'exam_type_id', type: 'bigint' })
  examTypeId: number;

  @ManyToOne(() => ExamType)
  @JoinColumn({ name: 'exam_type_id' })
  examType?: ExamType;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @Column({ name: 'requested_at', type: 'timestamp' })
  requestedAt: Date;

  @ApiProperty({ example: 'PENDING' })
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @ApiProperty({ example: 'Jejum 8 horas', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
