import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'thermal_printers' })
export class ThermalPrinter {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'Impressora Recepção' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: 'RECEPCAO_80MM' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ example: 'BROWSER_PRINT' })
  @Column({ name: 'connection_type', type: 'varchar', length: 20 })
  connectionType: string;

  @ApiProperty({ example: 'browser' })
  @Column({ type: 'varchar', length: 255 })
  target: string;

  @ApiProperty({ example: 80 })
  @Column({ name: 'paper_width_mm', type: 'int', default: 80 })
  paperWidthMm: number;

  @ApiProperty({ example: 48 })
  @Column({ type: 'int', default: 48 })
  columns: number;

  @ApiProperty({ example: true })
  @Column({ name: 'supports_qr_code', type: 'boolean', default: true })
  supportsQrCode: boolean;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
