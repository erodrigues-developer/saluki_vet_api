import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiConversationsService } from './ai-conversations.service';
import { FindOrCreateAiConversationDto } from './dto/find-or-create-ai-conversation.dto';
import { CreateAiMessageDto } from './dto/create-ai-message.dto';
import { CreateAiActionDto } from './dto/create-ai-action.dto';

@ApiTags('AI Conversations')
@ApiBearerAuth()
@Controller({
  path: 'ai/conversations',
  version: '1',
})
export class AiConversationsController {
  constructor(private readonly service: AiConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista conversas de IA por contexto' })
  findAll(@Query() query: any, @Req() req: any) {
    return this.service.findAll(query, req.user?.userId);
  }

  @Post('context/:contextType/:contextId')
  @ApiOperation({ summary: 'Busca ou cria conversa aberta para um contexto' })
  findOrCreate(
    @Param('contextType') contextType: string,
    @Param('contextId') contextId: string,
    @Body() payload: FindOrCreateAiConversationDto,
    @Req() req: any,
  ) {
    return this.service.findOrCreate(
      contextType,
      contextId,
      payload,
      req.user?.userId,
    );
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Lista mensagens de uma conversa de IA' })
  findMessages(@Param('id', ParseIntPipe) id: number) {
    return this.service.findMessages(id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Adiciona mensagem e opcionalmente gera resposta' })
  createMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateAiMessageDto,
    @Req() req: any,
  ) {
    return this.service.createMessage(id, payload, req.user?.userId);
  }

  @Post(':id/actions')
  @ApiOperation({ summary: 'Registra ação tomada a partir do chat' })
  registerAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateAiActionDto,
    @Req() req: any,
  ) {
    return this.service.registerAction(id, payload, req.user?.userId);
  }
}
