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
import { InpatientRecord } from './inpatient-record.entity';
import { Box } from '../../boxes/entities/box.entity';

@Entity({ name: 'inpatient_record_transfers' })
export class InpatientRecordTransfer {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 10 })
  @Column({ name: 'inpatient_record_id', type: 'bigint' })
  inpatientRecordId: number;

  @ManyToOne(() => InpatientRecord)
  @JoinColumn({ name: 'inpatient_record_id' })
  inpatientRecord?: InpatientRecord;

  @ApiProperty({ example: 2 })
  @Column({ name: 'from_box_id', type: 'bigint' })
  fromBoxId: number;

  @ManyToOne(() => Box)
  @JoinColumn({ name: 'from_box_id' })
  fromBox?: Box;

  @ApiProperty({ example: 5 })
  @Column({ name: 'to_box_id', type: 'bigint' })
  toBoxId: number;

  @ManyToOne(() => Box)
  @JoinColumn({ name: 'to_box_id' })
  toBox?: Box;

  @ApiProperty({ example: 'Paciente precisa de leito com monitorizacao continua.' })
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ example: '2026-06-07T14:30:00.000Z' })
  @Column({ name: 'transferred_at', type: 'timestamp' })
  transferredAt: Date;

  @ApiProperty({ example: '2026-06-07T14:31:00.000Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-07T14:31:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
