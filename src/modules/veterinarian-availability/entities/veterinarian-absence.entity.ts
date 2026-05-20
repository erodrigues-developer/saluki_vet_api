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

@Entity({ name: 'veterinarian_absences' })
export class VeterinarianAbsence {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 10 })
  @Column({ name: 'veterinarian_id', type: 'bigint' })
  veterinarianId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian?: User;

  @ApiProperty({ example: '2026-06-10' })
  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @ApiProperty({ example: '2026-06-20' })
  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @ApiProperty({ example: 'Férias' })
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
