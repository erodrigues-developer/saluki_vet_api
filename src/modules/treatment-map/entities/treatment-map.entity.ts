import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InpatientRecord } from '../../inpatient-records/entities/inpatient-record.entity';
import { Product } from '../../products/entities/product.entity';
import { Procedure } from '../../procedures/entities/procedure.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'treatment_map' })
export class TreatmentMap {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'inpatient_record_id', type: 'bigint' })
  inpatientRecordId: number;

  @ManyToOne(() => InpatientRecord)
  @JoinColumn({ name: 'inpatient_record_id' })
  inpatientRecord?: InpatientRecord;

  @ApiProperty({ example: '2024-07-09T18:00:00Z' })
  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @ApiProperty({ example: '2024-07-09T18:05:00Z', nullable: true })
  @Column({ name: 'executed_at', type: 'timestamp', nullable: true })
  executedAt?: Date | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'medicament_id', type: 'bigint', nullable: true })
  medicamentId?: number | null;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'medicament_id' })
  medicament?: Product;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'procedure_id', type: 'bigint', nullable: true })
  procedureId?: number | null;

  @ManyToOne(() => Procedure)
  @JoinColumn({ name: 'procedure_id' })
  procedure?: Procedure;

  @ApiProperty({ example: '2 ml IV', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  dose?: string | null;

  @ApiProperty({ example: 'PENDING' })
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ name: 'executed_by_user_id', type: 'bigint', nullable: true })
  executedByUserId?: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'executed_by_user_id' })
  executedByUser?: User;

  @ApiProperty({ example: 'Aplicar devagar', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
