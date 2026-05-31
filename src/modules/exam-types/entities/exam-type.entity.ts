import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExamCategory } from '../../exam-categories/entities/exam-category.entity';

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

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'exam_category_id', type: 'bigint', nullable: true })
  examCategoryId?: number | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => ExamCategory, { nullable: true })
  @JoinColumn({ name: 'exam_category_id' })
  examCategory?: ExamCategory | null;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
