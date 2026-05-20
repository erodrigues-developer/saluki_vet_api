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
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'veterinarian_availability_blocks' })
export class VeterinarianAvailabilityBlock {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 10 })
  @Column({ name: 'veterinarian_id', type: 'bigint' })
  veterinarianId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian?: User;

  @ApiProperty({ example: '2026-05-15' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ example: '10:00' })
  @Column({ name: 'start_time', type: 'varchar', length: 5 })
  startTime: string;

  @ApiProperty({ example: '11:00' })
  @Column({ name: 'end_time', type: 'varchar', length: 5 })
  endTime: string;

  @ApiProperty({ example: 'Reunião' })
  @Column({ type: 'varchar', length: 120 })
  reason: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
