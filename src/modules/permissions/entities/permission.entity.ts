import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

@Entity({ name: 'permissions' })
export class Permission {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 'cadastros.users.view' })
  @Column({ type: 'varchar', length: 120, unique: true })
  code: string;

  @ApiProperty({ example: 'Ver usuários' })
  @Column({ type: 'varchar', length: 160 })
  name: string;

  @ApiProperty({ example: 'Cadastros' })
  @Column({ type: 'varchar', length: 80 })
  module: string;

  @ApiProperty({ example: 'Usuários' })
  @Column({ type: 'varchar', length: 80 })
  resource: string;

  @ApiProperty({ example: 'view' })
  @Column({ type: 'varchar', length: 40 })
  action: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_system', type: 'boolean', default: true })
  isSystem: boolean;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @ApiProperty({ example: '2024-07-09T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-10T12:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
