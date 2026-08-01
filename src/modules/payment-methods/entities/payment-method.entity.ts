import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'payment_methods' })
export class PaymentMethod {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'PIX' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ example: 'Pix' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: '17', nullable: true })
  @Column({
    name: 'fiscal_payment_type_code',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  fiscalPaymentTypeCode?: string | null;

  @ApiProperty({ example: 'INTEGRATED', nullable: true })
  @Column({ name: 'integration_type', type: 'varchar', length: 30, nullable: true })
  integrationType?: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
