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
import { Client } from '../../clients/entities/client.entity';
import { Species } from '../../species/entities/species.entity';
import { Breed } from '../../breeds/entities/breed.entity';

@Entity({ name: 'pets' })
export class Pet {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID do cliente' })
  @Column({ name: 'client_id', type: 'bigint' })
  clientId: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  @ApiProperty({
    type: () => Client,
    description: 'Cliente vinculado',
  })
  client?: Client;

  @ApiProperty({ example: 1, description: 'ID da espécie' })
  @Column({ name: 'species_id', type: 'bigint' })
  speciesId: number;

  @ManyToOne(() => Species, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'species_id' })
  @ApiProperty({
    type: () => Species,
    description: 'Espécie vinculada',
  })
  species?: Species;

  @ApiProperty({
    example: 1,
    required: false,
    nullable: true,
    description: 'ID da raça',
  })
  @Column({ name: 'breed_id', type: 'bigint', nullable: true })
  breedId?: number | null;

  @ManyToOne(() => Breed, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'breed_id' })
  @ApiProperty({
    type: () => Breed,
    required: false,
    nullable: true,
    description: 'Raça vinculada',
  })
  breed?: Breed | null;

  @ApiProperty({ example: 'Thor' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    example: 'M',
    required: false,
    description: 'Sexo (M, F, N)',
  })
  @Column({ type: 'varchar', length: 10, nullable: true })
  sex?: string | null;

  @ApiProperty({
    example: '2020-05-01',
    required: false,
    description: 'Data de nascimento',
  })
  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date | null;

  @ApiProperty({ example: 12.5, required: false, description: 'Peso em kg' })
  @Column({
    name: 'weight_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  weightKg?: number | null;

  @ApiProperty({ example: 'Caramelo', required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  color?: string | null;

  @ApiProperty({ example: 'MC-123456', required: false })
  @Column({ name: 'microchip_code', type: 'varchar', length: 100, nullable: true })
  microchipCode?: string | null;

  @ApiProperty({ example: 'Poeira', required: false })
  @Column({ type: 'text', nullable: true })
  allergies?: string | null;

  @ApiProperty({ example: 'Diabetes', required: false })
  @Column({ name: 'chronic_diseases', type: 'text', nullable: true })
  chronicDiseases?: string | null;

  @ApiProperty({ example: 'Muito dócil', required: false })
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
