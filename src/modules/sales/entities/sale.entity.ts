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
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { SaleItem } from '../../sale-items/entities/sale-item.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Entity({ name: 'sales' })
export class Sale {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'client_id', type: 'bigint', nullable: true })
  clientId?: number | null;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client?: Client | null;

  @ApiProperty({ example: 1 })
  @Column({ name: 'veterinarian_id', type: 'bigint' })
  veterinarianId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: User;

  @ApiProperty({ example: '2024-07-20T10:00:00Z' })
  @Column({ name: 'sale_date', type: 'timestamp' })
  saleDate: Date;

  @ApiProperty({ example: 'OPEN', description: 'OPEN, PAID, CANCELED' })
  @Column({ type: 'varchar', length: 20, default: 'OPEN' })
  status: string;

  @ApiProperty({ example: 150.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @ApiProperty({ example: 10.0 })
  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @ApiProperty({ example: 140.0 })
  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @ApiProperty({ example: 'Desconto de amigo', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @OneToMany(() => SaleItem, (item) => item.sale)
  items: SaleItem[];

  @OneToMany(() => Payment, (payment) => payment.sale)
  payments: Payment[];

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
