import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'appointment_types' })
export class AppointmentType {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'Consulta' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: 'Consulta clínica geral', nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 30 })
  @Column({ name: 'default_duration_minutes', type: 'int', default: 30 })
  defaultDurationMinutes: number;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
