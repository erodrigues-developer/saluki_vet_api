import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'exam_types' })
export class ExamType {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'Hemograma Completo' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    example: 'Avaliação da série vermelha e branca',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 80.0, nullable: true })
  @Column({
    name: 'default_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  defaultPrice?: number | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
