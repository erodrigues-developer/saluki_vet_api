import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index('UQ_suppliers_document_not_null', ['document'], {
  unique: true,
  where: '"document" IS NOT NULL',
})
@Entity({ name: 'suppliers' })
export class Supplier {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'Zoetis' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiPropertyOptional({ example: 'Zoetis Industria de Produtos Veterinarios Ltda' })
  @Column({ name: 'legal_name', type: 'varchar', length: 255, nullable: true })
  legalName?: string | null;

  @ApiPropertyOptional({ example: '12345678000199' })
  @Column({ type: 'varchar', length: 32, nullable: true })
  document?: string | null;

  @ApiPropertyOptional({ example: 'contato@fornecedor.com' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'Fornecedor homologado para compras recorrentes' })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
