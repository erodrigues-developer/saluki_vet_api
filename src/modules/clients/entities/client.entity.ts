import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'clients' })
export class Client {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'Maria Souza' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ example: '12345678900', nullable: true, required: false })
  @Column({ type: 'varchar', length: 32, nullable: true })
  document?: string | null;

  @ApiProperty({ example: '+55 11 4002-8922', nullable: true, required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string | null;

  @ApiProperty({
    example: '+55 11 99999-9999',
    nullable: true,
    required: false,
  })
  @Column({ name: 'mobile_phone', type: 'varchar', length: 50, nullable: true })
  mobilePhone?: string | null;

  @ApiProperty({
    example: 'maria.souza@email.com',
    nullable: true,
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @ApiProperty({ example: 'Av. Paulista', nullable: true, required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  street?: string | null;

  @ApiProperty({ example: '1000', nullable: true, required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  number?: string | null;

  @ApiProperty({ example: 'Apto 42', nullable: true, required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  complement?: string | null;

  @ApiProperty({ example: 'Bela Vista', nullable: true, required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  district?: string | null;

  @ApiProperty({ example: 'São Paulo', nullable: true, required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  city?: string | null;

  @ApiProperty({ example: 'SP', nullable: true, required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  state?: string | null;

  @ApiProperty({ example: '01310-000', nullable: true, required: false })
  @Column({ name: 'zip_code', type: 'varchar', length: 20, nullable: true })
  zipCode?: string | null;

  @ApiProperty({
    example: 'Prefere ser avisada via WhatsApp',
    nullable: true,
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ApiProperty({
    example: null,
    nullable: true,
    required: false,
    description: 'Soft delete timestamp',
  })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;
}
