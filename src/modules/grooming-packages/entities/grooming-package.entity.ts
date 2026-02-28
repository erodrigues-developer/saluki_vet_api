import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Pet } from '../../pets/entities/pet.entity';

@Entity({ name: 'grooming_packages' })
export class GroomingPackage {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'client_id', type: 'bigint' })
  clientId: number;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client?: Client;

  @ApiProperty({ example: 1 })
  @Column({ name: 'pet_id', type: 'bigint' })
  petId: number;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'pet_id' })
  pet?: Pet;

  @ApiProperty({ example: 4 })
  @Column({ name: 'total_sessions', type: 'int' })
  totalSessions: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'used_sessions', type: 'int', default: 0 })
  usedSessions: number;

  @ApiProperty({ example: 200.0, nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_paid', type: 'boolean', default: false })
  isPaid: boolean;

  @ApiProperty({ example: '2024-08-09', nullable: true })
  @Column({ name: 'expires_at', type: 'date', nullable: true })
  expiresAt?: Date | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
