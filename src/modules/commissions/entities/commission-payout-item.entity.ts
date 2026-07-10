import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Commission } from './commission.entity';
import { CommissionPayout } from './commission-payout.entity';

@Entity({ name: 'commission_payout_items' })
export class CommissionPayoutItem {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'payout_id', type: 'bigint' })
  payoutId: number;

  @ManyToOne(() => CommissionPayout, (payout) => payout.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payout_id' })
  payout?: CommissionPayout;

  @ApiProperty({ example: 1 })
  @Column({ name: 'commission_id', type: 'bigint' })
  commissionId: number;

  @ManyToOne(() => Commission, (commission) => commission.payoutItems)
  @JoinColumn({ name: 'commission_id' })
  commission?: Commission;

  @ApiProperty({ example: 150.25 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: '2026-07-10T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
