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
import { Species } from '../../species/entities/species.entity';

@Entity({ name: 'breeds' })
export class Breed {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID da espécie' })
  @Column({ name: 'species_id', type: 'bigint' })
  speciesId: number;

  @ManyToOne(() => Species, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'species_id' })
  @ApiProperty({
    type: () => Species,
    description: 'Espécie vinculada',
  })
  species?: Species;

  @ApiProperty({ example: 'Bulldog' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
