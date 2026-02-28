import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { GroomingSession } from '../../grooming-sessions/entities/grooming-session.entity';

@Entity({ name: 'commissions' })
export class Commission {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'sale_id', type: 'bigint', nullable: true })
  saleId?: number | null;

  @ManyToOne(() => Sale)
  @JoinColumn({ name: 'sale_id' })
  sale?: Sale;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'consultation_id', type: 'bigint', nullable: true })
  consultationId?: number | null;

  @ManyToOne(() => Consultation)
  @JoinColumn({ name: 'consultation_id' })
  consultation?: Consultation;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'grooming_session_id', type: 'bigint', nullable: true })
  groomingSessionId?: number | null;

  @ManyToOne(() => GroomingSession)
  @JoinColumn({ name: 'grooming_session_id' })
  groomingSession?: GroomingSession;

  @ApiProperty({ example: 25.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @Column({ name: 'calculated_at', type: 'timestamp' })
  calculatedAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z', nullable: true })
  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date | null;

  @ApiProperty({ example: 'PENDING' })
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;
}
