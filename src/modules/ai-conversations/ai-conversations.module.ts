import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiConversationMessage } from './entities/ai-conversation-message.entity';
import { AiConversationsController } from './ai-conversations.controller';
import { AiConversationsService } from './ai-conversations.service';
import { AiConversationAiService } from './ai-conversation-ai.service';
import { AiConversationGuardrailsService } from './ai-conversation-guardrails.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiConversation, AiConversationMessage])],
  controllers: [AiConversationsController],
  providers: [
    AiConversationsService,
    AiConversationAiService,
    AiConversationGuardrailsService,
  ],
  exports: [AiConversationsService],
})
export class AiConversationsModule {}
