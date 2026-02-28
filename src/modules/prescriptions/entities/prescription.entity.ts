import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'prescriptions' })
export class Prescription {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'consultation_id', type: 'bigint', nullable: true })
  consultationId?: number | null;

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
  @Column({ name: 'veterinarian_id', type: 'bigint' })
  veterinarianId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian?: User;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @Column({ name: 'prescribed_at', type: 'timestamp' })
  prescribedAt: Date;

  @ApiProperty({ example: 'Dipirona 1 gota/kg VO a cada 8h' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ example: '2024-08-09', nullable: true })
  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate?: Date | null;
}
