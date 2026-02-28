import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'appointment_statuses' })
export class AppointmentStatus {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'SCHEDULED' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ example: 'Agendado' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({
    example: true,
    description: 'Se é um status do sistema (não deletável)',
  })
  @Column({ name: 'is_system', type: 'boolean', default: true })
  isSystem: boolean;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
