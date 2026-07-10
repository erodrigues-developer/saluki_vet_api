import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'consultation_attachments' })
export class ConsultationAttachment {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'consultation_id', type: 'bigint' })
  consultationId: number;

  @ManyToOne(() => Consultation)
  @JoinColumn({ name: 'consultation_id' })
  consultation?: Consultation;

  @ApiProperty({ example: 1 })
  @Column({ name: 'pet_id', type: 'bigint' })
  petId: number;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'pet_id' })
  pet?: Pet;

  @ApiProperty({ example: 1 })
  @Column({ name: 'client_id', type: 'bigint' })
  clientId: number;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client?: Client;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'uploaded_by_user_id', type: 'bigint', nullable: true })
  uploadedByUserId?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploaded_by_user_id' })
  uploadedByUser?: User | null;

  @ApiProperty({ example: 'DOCUMENT' })
  @Column({ name: 'attachment_type', type: 'varchar', length: 30 })
  attachmentType: string;

  @ApiProperty({ example: 'hemograma.pdf' })
  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @ApiProperty({ example: 'application/pdf' })
  @Column({ name: 'mime_type', type: 'varchar', length: 150 })
  mimeType: string;

  @ApiProperty({ example: 204800 })
  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @ApiProperty({ example: 'consultations/attachments/file.pdf' })
  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  storageKey: string;

  @ApiProperty({ example: 'https://cdn.example.com/file.pdf' })
  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl: string;

  @ApiProperty({ example: 'Exame enviado pelo tutor', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: '2026-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-09T12:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;
}
