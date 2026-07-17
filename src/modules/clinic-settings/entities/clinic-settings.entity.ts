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

  @ApiProperty({ example: 'Clínica Veterinária Saluki' })
  @Column({ name: 'name', type: 'varchar', length: 200, default: 'Minha Clínica' })
  name: string;

  @ApiProperty({ example: 'Saluki', nullable: true })
  @Column({ name: 'short_name', type: 'varchar', length: 100, nullable: true })
  shortName?: string | null;

  @ApiProperty({ example: 'Rua das Acácias, 120 - Centro', nullable: true })
  @Column({ name: 'address', type: 'text', nullable: true })
  address?: string | null;

  @ApiProperty({ example: 'Rua das Acácias', nullable: true })
  @Column({ name: 'street', type: 'varchar', length: 255, nullable: true })
  street?: string | null;

  @ApiProperty({ example: '120', nullable: true })
  @Column({ name: 'number', type: 'varchar', length: 50, nullable: true })
  number?: string | null;

  @ApiProperty({ example: 'Centro', nullable: true })
  @Column({ name: 'district', type: 'varchar', length: 255, nullable: true })
  district?: string | null;

  @ApiProperty({ example: 'Sala 2', nullable: true })
  @Column({ name: 'complement', type: 'varchar', length: 255, nullable: true })
  complement?: string | null;

  @ApiProperty({ example: '01310-000', nullable: true })
  @Column({ name: 'zip_code', type: 'varchar', length: 20, nullable: true })
  zipCode?: string | null;

  @ApiProperty({ example: 'São Paulo', nullable: true })
  @Column({ name: 'city', type: 'varchar', length: 255, nullable: true })
  city?: string | null;

  @ApiProperty({ example: 'SP', nullable: true })
  @Column({ name: 'state', type: 'varchar', length: 50, nullable: true })
  state?: string | null;

  @ApiProperty({ example: '12.345.678/0001-90', nullable: true })
  @Column({ name: 'cnpj', type: 'varchar', length: 18, nullable: true })
  cnpj?: string | null;

  @ApiProperty({ example: '(11) 3333-4444', nullable: true })
  @Column({ name: 'phone', type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  @ApiProperty({ example: '(11) 99999-8888', nullable: true })
  @Column({ name: 'whatsapp', type: 'varchar', length: 30, nullable: true })
  whatsapp?: string | null;

  @ApiProperty({ example: 'contato@saluki.vet', nullable: true })
  @Column({ name: 'email', type: 'varchar', length: 200, nullable: true })
  email?: string | null;

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

  @ApiProperty({ example: 'data:image/png;base64,iVBORw0KGgo...', nullable: true })
  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string | null;

  @ApiProperty({ example: 'data:image/png;base64,iVBORw0KGgo...', nullable: true })
  @Column({ name: 'login_image_url', type: 'text', nullable: true })
  loginImageUrl?: string | null;

  @ApiProperty({ example: '#2563EB', nullable: true })
  @Column({ name: 'primary_color', type: 'varchar', length: 7, nullable: true })
  primaryColor?: string | null;

  @ApiProperty({ example: '#0F172A', nullable: true })
  @Column({ name: 'secondary_color', type: 'varchar', length: 7, nullable: true })
  secondaryColor?: string | null;

  @ApiProperty({ example: 'Bem-vindo à clínica.', nullable: true })
  @Column({ name: 'login_message', type: 'text', nullable: true })
  loginMessage?: string | null;

  @ApiProperty({ example: 'BRL', description: 'Moeda padrão' })
  @Column({
    name: 'default_currency',
    type: 'varchar',
    length: 10,
    default: 'BRL',
  })
  defaultCurrency: string;

  @ApiProperty({
    example: 'America/Sao_Paulo',
    description: 'Timezone IANA oficial da clínica',
  })
  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 100,
    default: 'America/Sao_Paulo',
  })
  timezone: string;

  @ApiProperty({
    example: 10,
    description: 'Tolerância em minutos para considerar agendamento atrasado',
  })
  @Column({
    name: 'check_in_tolerance_minutes',
    type: 'int',
    default: 10,
  })
  checkInToleranceMinutes: number;

  @ApiProperty({
    example: 12,
    description:
      'Quantidade de meses futuros a serem gerados para contas a pagar recorrentes',
  })
  @Column({
    name: 'accounts_payable_recurrence_horizon_months',
    type: 'int',
    default: 12,
  })
  accountsPayableRecurrenceHorizonMonths: number;

  @ApiProperty({ example: 'Notas da clínica', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: 'Dra. Ana Souza', nullable: true })
  @Column({ name: 'technical_responsible_name', type: 'varchar', length: 200, nullable: true })
  technicalResponsibleName?: string | null;

  @ApiProperty({ example: '12345', nullable: true })
  @Column({ name: 'technical_responsible_crmv', type: 'varchar', length: 30, nullable: true })
  technicalResponsibleCrmv?: string | null;

  @ApiProperty({ example: 'SP', nullable: true })
  @Column({ name: 'technical_responsible_crmv_uf', type: 'varchar', length: 2, nullable: true })
  technicalResponsibleCrmvUf?: string | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
