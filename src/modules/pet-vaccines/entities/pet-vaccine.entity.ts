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
import { Vaccine } from '../../vaccines/entities/vaccine.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'pet_vaccines' })
export class PetVaccine {
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
  @Column({ name: 'vaccine_id', type: 'bigint' })
  vaccineId: number;

  @ManyToOne(() => Vaccine)
  @JoinColumn({ name: 'vaccine_id' })
  vaccine?: Vaccine;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'consultation_id', type: 'bigint', nullable: true })
  consultationId?: number | null;

  @ManyToOne(() => Consultation)
  @JoinColumn({ name: 'consultation_id' })
  consultation?: Consultation;

  @ApiProperty({ example: '2024-07-09' })
  @Column({ name: 'application_date', type: 'date' })
  applicationDate: Date;

  @ApiProperty({ example: '2025-07-09', nullable: true })
  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: Date | null;

  @ApiProperty({ example: 'LOTE-123', nullable: true })
  @Column({
    name: 'batch_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  batchNumber?: string | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'veterinarian_id', type: 'bigint', nullable: true })
  veterinarianId?: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian?: User;

  @ApiProperty({ example: 'Animal agitado na aplicação', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
