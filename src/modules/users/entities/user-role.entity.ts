import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity({ name: 'user_roles' })
export class UserRole {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId: number;

  @PrimaryColumn({ name: 'role_id', type: 'bigint' })
  roleId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
