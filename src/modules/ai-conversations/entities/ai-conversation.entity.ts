import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiConversationMessage } from './ai-conversation-message.entity';

export type AiConversationStatus = 'OPEN' | 'ARCHIVED';

@Entity({ name: 'ai_conversations' })
@Index(['contextType', 'contextId'])
@Index(['userId', 'contextType', 'contextId'])
export class AiConversation {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 12, nullable: true })
  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId?: number | null;

  @ApiProperty({ example: 'dashboard.operational' })
  @Column({ name: 'context_type', type: 'varchar', length: 80 })
  contextType: string;

  @ApiProperty({ example: 'current' })
  @Column({ name: 'context_id', type: 'varchar', length: 120 })
  contextId: string;

  @ApiProperty({ example: 'Assistente inteligente', nullable: true })
  @Column({ type: 'varchar', length: 180, nullable: true })
  title?: string | null;

  @ApiProperty({ example: 'OPEN' })
  @Column({ type: 'varchar', length: 20, default: 'OPEN' })
  status: AiConversationStatus;

  @ApiProperty({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @OneToMany(() => AiConversationMessage, (message) => message.conversation)
  messages?: AiConversationMessage[];

  @ApiProperty({ example: '2026-05-26T12:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-26T12:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
