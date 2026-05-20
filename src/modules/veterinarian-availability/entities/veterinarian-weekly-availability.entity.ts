import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'veterinarian_weekly_availabilities' })
@Unique('uq_vet_weekday', ['veterinarianId', 'weekday'])
export class VeterinarianWeeklyAvailability {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 10 })
  @Column({ name: 'veterinarian_id', type: 'bigint' })
  veterinarianId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian?: User;

  @ApiProperty({ example: 1, description: '0=Domingo ... 6=Sábado' })
  @Column({ type: 'smallint' })
  weekday: number;

  @ApiProperty({ example: true })
  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;

  @ApiProperty({ example: [{ startTime: '08:00', endTime: '12:00' }, { startTime: '14:00', endTime: '18:00' }] })
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  periods: Array<{ startTime: string; endTime: string }>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
