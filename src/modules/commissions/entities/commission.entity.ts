import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { Procedure } from '../../procedures/entities/procedure.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { CommissionPayoutItem } from './commission-payout-item.entity';

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
  @Column({ name: 'appointment_id', type: 'bigint', nullable: true })
  appointmentId?: number | null;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'grooming_session_id', type: 'bigint', nullable: true })
  groomingSessionId?: number | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'procedure_id', type: 'bigint', nullable: true })
  procedureId?: number | null;

  @ManyToOne(() => Procedure, { nullable: true })
  @JoinColumn({ name: 'procedure_id' })
  procedure?: Procedure | null;

  @ApiProperty({ example: 25.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: 'SALE', nullable: true })
  @Column({ name: 'origin_type', type: 'varchar', length: 30, nullable: true })
  originType?: string | null;

  @ApiProperty({ example: 15, nullable: true })
  @Column({ name: 'origin_reference_id', type: 'bigint', nullable: true })
  originReferenceId?: number | null;

  @ApiProperty({ example: 150, nullable: true })
  @Column({
    name: 'base_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  baseAmount?: number | null;

  @ApiProperty({ example: 15, nullable: true })
  @Column({
    name: 'rate_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  ratePercent?: number | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @Column({ name: 'calculated_at', type: 'timestamp' })
  calculatedAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z', nullable: true })
  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date | null;

  @ApiProperty({ example: '2024-07-10T12:00:00Z', nullable: true })
  @Column({ name: 'canceled_at', type: 'timestamp', nullable: true })
  canceledAt?: Date | null;

  @ApiProperty({ example: 10, nullable: true })
  @Column({
    name: 'reversal_of_commission_id',
    type: 'bigint',
    nullable: true,
  })
  reversalOfCommissionId?: number | null;

  @ManyToOne(() => Commission, { nullable: true })
  @JoinColumn({ name: 'reversal_of_commission_id' })
  reversalOfCommission?: Commission | null;

  @ApiProperty({ example: 'PENDING' })
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @ApiProperty({ example: 'Estorno pela reabertura da venda', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @OneToMany(() => CommissionPayoutItem, (payoutItem) => payoutItem.commission)
  payoutItems?: CommissionPayoutItem[];
}
