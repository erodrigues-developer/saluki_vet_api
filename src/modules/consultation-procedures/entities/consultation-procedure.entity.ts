import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'consultation_procedures' })
export class ConsultationProcedure {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'consultation_id', type: 'bigint' })
  consultationId: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'procedure_id', type: 'bigint' })
  procedureId: number;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ApiProperty({ example: 150.0 })
  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty({ example: 150.0 })
  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;
}
