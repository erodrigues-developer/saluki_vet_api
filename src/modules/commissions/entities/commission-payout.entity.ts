import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AccountPayable } from '../../accounts-payable/entities/account-payable.entity';
import { CommissionPayoutItem } from './commission-payout-item.entity';

@Entity({ name: 'commission_payouts' })
export class CommissionPayout {
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
  @Column({ name: 'account_payable_id', type: 'bigint', nullable: true })
  accountPayableId?: number | null;

  @ManyToOne(() => AccountPayable, { nullable: true })
  @JoinColumn({ name: 'account_payable_id' })
  accountPayable?: AccountPayable | null;

  @ApiProperty({ example: '2026-07-01' })
  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  @ApiProperty({ example: '2026-07-31' })
  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  @ApiProperty({ example: 1000 })
  @Column({
    name: 'gross_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  grossAmount: number;

  @ApiProperty({ example: -50 })
  @Column({
    name: 'adjustment_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  adjustmentAmount: number;

  @ApiProperty({ example: 950 })
  @Column({
    name: 'net_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  netAmount: number;

  @ApiProperty({ example: 'OPEN' })
  @Column({ type: 'varchar', length: 20, default: 'OPEN' })
  status: string;

  @ApiProperty({ example: 'Pagamento da competência 07/2026', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: '2026-07-10T15:00:00Z', nullable: true })
  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date | null;

  @OneToMany(() => CommissionPayoutItem, (item) => item.payout)
  items?: CommissionPayoutItem[];

  @ApiProperty({ example: '2026-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
