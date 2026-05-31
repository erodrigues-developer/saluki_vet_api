import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AiConversation } from './ai-conversation.entity';

export type AiConversationMessageRole =
  | 'USER'
  | 'ASSISTANT'
  | 'SYSTEM'
  | 'ACTION'
  | 'TOOL';

@Entity({ name: 'ai_conversation_messages' })
@Index(['conversationId', 'createdAt'])
export class AiConversationMessage {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'conversation_id', type: 'bigint' })
  conversationId: number;

  @ManyToOne(() => AiConversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: AiConversation;

  @ApiProperty({ example: 12, nullable: true })
  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId?: number | null;

  @ApiProperty({ example: 'USER' })
  @Column({ type: 'varchar', length: 20 })
  role: AiConversationMessageRole;

  @ApiProperty({ example: 'Como está a performance da clínica?' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @ApiProperty({ nullable: true })
  @Column({
    name: 'idempotency_key',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  idempotencyKey?: string | null;

  @ApiProperty({ example: '2026-05-26T12:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
