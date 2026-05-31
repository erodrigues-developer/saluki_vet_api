import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { AiConversationMessageRole } from '../entities/ai-conversation-message.entity';

export class CreateAiMessageDto {
  @ApiPropertyOptional({ example: 'USER' })
  @IsOptional()
  @IsIn(['USER', 'ASSISTANT', 'SYSTEM', 'ACTION', 'TOOL'])
  role?: AiConversationMessageRole;

  @ApiPropertyOptional({ example: 'O que devo priorizar agora?' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  contextSnapshot?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  generateAssistantResponse?: boolean;
}
