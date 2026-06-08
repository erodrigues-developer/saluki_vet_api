import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'stock_locations' })
export class StockLocation {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'Estoque Principal' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: false })
  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

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
