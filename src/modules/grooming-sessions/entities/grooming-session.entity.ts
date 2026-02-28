import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { User } from '../../users/entities/user.entity';
import { GroomingPackage } from '../../grooming-packages/entities/grooming-package.entity';

@Entity({ name: 'grooming_sessions' })
export class GroomingSession {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'pet_id', type: 'bigint' })
  petId: number;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'pet_id' })
  pet?: Pet;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'groomer_id', type: 'bigint', nullable: true })
  groomerId?: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'groomer_id' })
  groomer?: User;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'package_id', type: 'bigint', nullable: true })
  packageId?: number | null;

  @ManyToOne(() => GroomingPackage)
  @JoinColumn({ name: 'package_id' })
  groomingPackage?: GroomingPackage;

  @ApiProperty({ example: '2024-07-09T14:00:00Z' })
  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @ApiProperty({ example: '2024-07-09T14:05:00Z', nullable: true })
  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date | null;

  @ApiProperty({ example: '2024-07-09T15:00:00Z', nullable: true })
  @Column({ name: 'finished_at', type: 'timestamp', nullable: true })
  finishedAt?: Date | null;

  @ApiProperty({ example: 'SCHEDULED' })
  @Column({ type: 'varchar', length: 20, default: 'SCHEDULED' })
  status: string;

  @ApiProperty({ example: 'Tosa higiênica', nullable: true })
  @Column({ name: 'service_notes', type: 'text', nullable: true })
  serviceNotes?: string | null;

  @ApiProperty({ example: '{"orelhas": "limpas"}', nullable: true })
  @Column({ name: 'checklist_json', type: 'text', nullable: true })
  checklistJson?: string | null;

  @ApiProperty({ example: 50.0, nullable: true })
  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  totalAmount?: number | null;
}
