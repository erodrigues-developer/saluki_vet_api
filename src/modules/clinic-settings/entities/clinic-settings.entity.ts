import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'clinic_settings' })
export class ClinicSettings {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({
    example: 30,
    description: 'Duração padrão do slot de agendamento em minutos',
  })
  @Column({
    name: 'appointment_slot_duration_minutes',
    type: 'int',
    default: 30,
  })
  appointmentSlotDurationMinutes: number;

  @ApiProperty({
    example: '{"seg": ["08:00-18:00"]}',
    description: 'JSON com horários de funcionamento',
  })
  @Column({ name: 'business_hours_json', type: 'text', nullable: true })
  businessHoursJson?: string | null;

  @ApiProperty({ example: 'https://example.com/logo.png', nullable: true })
  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl?: string | null;

  @ApiProperty({ example: 'BRL', description: 'Moeda padrão' })
  @Column({
    name: 'default_currency',
    type: 'varchar',
    length: 10,
    default: 'BRL',
  })
  defaultCurrency: string;

  @ApiProperty({ example: 'Notas da clínica', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
