import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversation } from './entities/ai-conversation.entity';
import {
  AiConversationMessage,
  AiConversationMessageRole,
} from './entities/ai-conversation-message.entity';
import { FindOrCreateAiConversationDto } from './dto/find-or-create-ai-conversation.dto';
import { CreateAiMessageDto } from './dto/create-ai-message.dto';
import { CreateAiActionDto } from './dto/create-ai-action.dto';
import { AiConversationAiService } from './ai-conversation-ai.service';
import { AiConversationGuardrailsService } from './ai-conversation-guardrails.service';

@Injectable()
export class AiConversationsService {
  private readonly logger = new Logger(AiConversationsService.name);

  constructor(
    @InjectRepository(AiConversation)
    private readonly conversationsRepository: Repository<AiConversation>,
    @InjectRepository(AiConversationMessage)
    private readonly messagesRepository: Repository<AiConversationMessage>,
    private readonly aiService: AiConversationAiService,
    private readonly guardrailsService: AiConversationGuardrailsService,
  ) {}

  async findAll(query: any, userId?: number) {
    const where: Record<string, any> = {};
    if (query?.contextType) where.contextType = query.contextType;
    if (query?.contextId) where.contextId = String(query.contextId);
    if (userId) where.userId = userId;

    return this.conversationsRepository.find({
      where,
      order: { updatedAt: 'DESC' },
      take: Math.min(Number(query?.limit || 30), 100),
    });
  }

  async findOrCreate(
    contextType: string,
    contextId: string,
    payload: FindOrCreateAiConversationDto,
    userId?: number,
  ) {
    const normalizedContextId = String(contextId || 'current');
    const conversation = await this.conversationsRepository.manager.transaction(
      async (manager) => {
        const repository = manager.getRepository(AiConversation);
        const lockKey = [
          'ai-conversation',
          userId || 'anonymous',
          contextType,
          normalizedContextId,
        ].join(':');
        await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
          lockKey,
        ]);

        let current = await repository.findOne({
          where: {
            contextType,
            contextId: normalizedContextId,
            userId: userId || null,
            status: 'OPEN',
          },
          order: { updatedAt: 'DESC' },
        });

        if (!current) {
          current = await repository.save(
            repository.create({
              contextType,
              contextId: normalizedContextId,
              userId: userId || null,
              title: payload?.title || this.defaultTitleForContext(contextType),
              status: 'OPEN',
              metadata: payload?.metadata || null,
            }),
          );
        } else if (payload?.metadata || payload?.title) {
          current = await repository.save({
            ...current,
            title: payload.title || current.title,
            metadata: {
              ...(current.metadata || {}),
              ...(payload.metadata || {}),
            },
          });
        }

        return current;
      },
    );

    if (payload?.initialAssistantMessage) {
      await this.ensureInitialAssistantMessage(
        conversation.id,
        payload.initialAssistantMessage,
      );
    }

    const messages = await this.findMessages(conversation.id);
    return { conversation, messages };
  }

  async findMessages(conversationId: number) {
    await this.ensureConversation(conversationId);
    return this.messagesRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async createMessage(
    conversationId: number,
    payload: CreateAiMessageDto,
    userId?: number,
  ) {
    const conversation = await this.ensureConversation(conversationId);
    const role: AiConversationMessageRole = payload.role || 'USER';
    const content = String(payload.content || '').trim();

    if (!content) {
      throw new NotFoundException('Mensagem vazia');
    }

    const shouldGenerate =
      payload.generateAssistantResponse !== false && role === 'USER';
    const idempotencyKey =
      !shouldGenerate && payload.metadata?.idempotencyKey
        ? String(payload.metadata.idempotencyKey).trim().slice(0, 255)
        : null;

    if (idempotencyKey) {
      const existingMessage = await this.messagesRepository.findOneBy({
        conversationId,
        idempotencyKey,
      });
      if (existingMessage) return { message: existingMessage };
    }

    const inputGuardrail = shouldGenerate
      ? this.guardrailsService.evaluateInput({
          conversation,
          userText: content,
          contextSnapshot: payload.contextSnapshot,
        })
      : null;

    let message: AiConversationMessage;
    try {
      message = await this.messagesRepository.save(
        this.messagesRepository.create({
          conversationId,
          userId: role === 'USER' || role === 'ACTION' ? userId || null : null,
          role,
          content,
          idempotencyKey,
          metadata: {
            ...(payload.metadata || {}),
            ...(payload.contextSnapshot
              ? { contextSnapshot: payload.contextSnapshot }
              : {}),
            ...(inputGuardrail ? { guardrail: inputGuardrail } : {}),
          },
        }),
      );
    } catch (error: any) {
      if (idempotencyKey && error?.code === '23505') {
        const existingMessage = await this.messagesRepository.findOneBy({
          conversationId,
          idempotencyKey,
        });
        if (existingMessage) return { message: existingMessage };
      }
      throw error;
    }

    await this.touchConversation(conversation);

    if (!shouldGenerate) {
      return { message };
    }

    if (inputGuardrail?.decision !== 'ALLOW') {
      const assistantMessage = await this.messagesRepository.save(
        this.messagesRepository.create({
          conversationId,
          role: 'ASSISTANT',
          content: inputGuardrail.response || this.defaultGuardrailResponse(),
          metadata: {
            generatedBy: 'guardrail',
            guardrail: inputGuardrail,
            contextSnapshot: payload.contextSnapshot || null,
          },
        }),
      );
      await this.touchConversation(conversation);
      return { message, assistantMessage };
    }

    const previousMessages = await this.messagesRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    const generated = await this.generateAssistantResponse(
      conversation,
      content,
      payload.contextSnapshot,
      previousMessages.filter((item) => String(item.id) !== String(message.id)),
    );
    const outputGuardrail = this.guardrailsService.validateOutput({
      conversation,
      assistantText: generated.content,
    });
    const assistantContent =
      outputGuardrail.decision === 'ALLOW'
        ? generated.content
        : outputGuardrail.response || this.defaultGuardrailResponse();

    const assistantMessage = await this.messagesRepository.save(
      this.messagesRepository.create({
        conversationId,
        role: 'ASSISTANT',
        content: assistantContent,
        metadata: {
          generatedBy:
            outputGuardrail.decision === 'ALLOW'
              ? generated.generatedBy
              : 'guardrail',
          fallbackReason: generated.fallbackReason || null,
          guardrail: {
            input: inputGuardrail,
            output: outputGuardrail,
          },
          contextSnapshot: payload.contextSnapshot || null,
        },
      }),
    );
    await this.touchConversation(conversation);

    return { message, assistantMessage };
  }

  async registerAction(
    conversationId: number,
    payload: CreateAiActionDto,
    userId?: number,
  ) {
    const label = payload.label || payload.actionKey;
    const actionMessage = await this.messagesRepository.save(
      this.messagesRepository.create({
        conversationId,
        userId: userId || null,
        role: 'ACTION',
        content: label,
        metadata: {
          actionKey: payload.actionKey,
          payload: payload.payload || null,
        },
      }),
    );
    const conversation = await this.ensureConversation(conversationId);
    await this.touchConversation(conversation);
    return { message: actionMessage };
  }

  private async ensureInitialAssistantMessage(
    conversationId: number,
    content: string,
  ) {
    const count = await this.messagesRepository.count({
      where: { conversationId },
    });
    if (count > 0) return;
    try {
      await this.messagesRepository.save(
        this.messagesRepository.create({
          conversationId,
          role: 'ASSISTANT',
          content,
          idempotencyKey: 'initial-message',
          metadata: { source: 'initial-message' },
        }),
      );
    } catch (error: any) {
      if (error?.code !== '23505') throw error;
    }
  }

  private async ensureConversation(id: number) {
    const conversation = await this.conversationsRepository.findOneBy({ id });
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    return conversation;
  }

  private async touchConversation(conversation: AiConversation) {
    await this.conversationsRepository.save({
      ...conversation,
      updatedAt: new Date(),
    });
  }

  private defaultTitleForContext(contextType: string) {
    if (contextType.includes('dashboard')) return 'Assistente inteligente';
    if (contextType.includes('clinical-support')) return 'Apoio clínico da IA';
    if (contextType.includes('anamnesis')) return 'Anamnese sugerida pela IA';
    return 'Conversa com IA';
  }

  private defaultGuardrailResponse() {
    return 'Este assistente está disponível apenas para apoiar tarefas relacionadas ao Saluki Vet, à operação da clínica e aos dados da tela atual.';
  }

  private async generateAssistantResponse(
    conversation: AiConversation,
    userText: string,
    contextSnapshot: Record<string, any> | undefined,
    messages: AiConversationMessage[],
  ) {
    try {
      const realResponse = await this.aiService.generateReply({
        conversation,
        messages,
        userText,
        contextSnapshot,
      });

      if (realResponse) {
        return {
          content: realResponse,
          generatedBy: `${this.aiService.getProviderName()}-conversation-engine`,
        };
      }

      return {
        content: this.generateMockAssistantResponse(
          conversation,
          userText,
          contextSnapshot,
        ),
        generatedBy: 'fallback-conversation-engine',
        fallbackReason: `${this.aiService.getProviderName()} api key not configured`,
      };
    } catch (error: any) {
      this.logger.error(
        'Failed to generate AI conversation response. Falling back to local response.',
        error?.stack,
      );
      return {
        content: this.generateMockAssistantResponse(
          conversation,
          userText,
          contextSnapshot,
        ),
        generatedBy: 'fallback-conversation-engine',
        fallbackReason: error?.message || 'ai_provider_error',
      };
    }
  }

  private generateMockAssistantResponse(
    conversation: AiConversation,
    userText: string,
    contextSnapshot?: Record<string, any>,
  ) {
    const text = userText.toLowerCase();
    if (conversation.contextType.includes('dashboard')) {
      return this.dashboardResponse(text, contextSnapshot);
    }
    if (conversation.contextType.includes('clinical-support')) {
      return this.clinicalSupportResponse(text, contextSnapshot);
    }
    if (conversation.contextType.includes('anamnesis')) {
      return this.anamnesisResponse(text, contextSnapshot);
    }
    return 'Posso ajudar com base no contexto atual da tela. Ainda estou operando em modo mockado, mas esta conversa já está persistida no histórico.';
  }

  private dashboardResponse(text: string, context?: Record<string, any>) {
    const overdue = context?.finance?.totalOverdue ?? context?.totalOverdue;
    const stock = context?.criticalStockCount ?? context?.stock?.criticalCount;
    const vaccines = context?.vaccines?.overdue ?? context?.overdueVaccines;

    if (/estoque|repor|produto/.test(text)) {
      return `O ponto de atenção é estoque. Há ${stock ?? 'alguns'} item(ns) críticos. Priorize itens com menor autonomia e maior impacto nos atendimentos do dia.`;
    }
    if (/vacina|vacinas/.test(text)) {
      return `Vacinas exigem acompanhamento ativo. Existem ${vaccines ?? 'pendências'} atrasada(s), então a recepção deve confirmar tutores e encaixes possíveis.`;
    }
    if (/finance|pagar|receber|risco/.test(text)) {
      return `No financeiro, acompanhe valores atrasados${overdue ? ` de aproximadamente R$ ${Number(overdue).toLocaleString('pt-BR')}` : ''}. A prioridade é separar o que vence hoje do que já está vencido.`;
    }
    return 'Prioridades sugeridas: revisar estoque crítico, acompanhar vacinas atrasadas, monitorar contas pendentes e observar a evolução dos atendimentos do dia.';
  }

  private anamnesisResponse(text: string, context?: Record<string, any>) {
    const anamnesis =
      context?.currentAnamnesis || context?.suggestedAnamnesis || '';
    if (/falta|faltou|perguntar|complementar/.test(text)) {
      return 'Perguntas úteis: início e duração dos sinais, evolução, alimentação, ingestão de água, urina/fezes, medicamentos administrados e contato com tóxicos.';
    }
    if (/resum|objetiv|reescrev/.test(text)) {
      return `Sugestão objetiva:\n${String(anamnesis || 'Anamnese ainda sem texto suficiente para resumir.').slice(0, 1200)}`;
    }
    return 'A anamnese pode ser refinada com informações de evolução, frequência dos sinais, fatores de melhora/piora e tratamentos prévios. O texto final deve ser revisado pelo veterinário antes de permanecer no prontuário.';
  }

  private clinicalSupportResponse(text: string, context?: Record<string, any>) {
    if (/exame|exames/.test(text)) {
      return 'Como apoio consultivo, considere exames complementares conforme sinais clínicos, estabilidade do paciente e hipóteses diferenciais. Priorize exames que mudem a conduta imediata.';
    }
    if (/risco|alerta|grave/.test(text)) {
      return 'Sinais de alerta incluem piora rápida, apatia intensa, desidratação, dor importante, alterações neurológicas, dispneia ou instabilidade hemodinâmica. Confirme sempre no exame físico.';
    }
    return `Apoio consultivo: correlacione anamnese, exame físico e resposta inicial antes de consolidar diagnóstico e conduta. ${context?.diagnosis ? `Hipótese atual registrada: ${context.diagnosis}.` : ''}`;
  }
}
