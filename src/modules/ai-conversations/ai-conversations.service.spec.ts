import { AiConversationsService } from './ai-conversations.service';

describe('AiConversationsService', () => {
  const conversation = { id: 7, contextType: 'consultation', contextId: '69' };
  const conversationsRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
  const messagesRepository = {
    create: jest.fn((payload) => payload),
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
  const aiService = {};
  const guardrailsService = {};

  let service: AiConversationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    conversationsRepository.findOneBy.mockResolvedValue(conversation);
    conversationsRepository.save.mockImplementation(async (payload) => payload);
    messagesRepository.create.mockImplementation((payload) => payload);
    service = new AiConversationsService(
      conversationsRepository as any,
      messagesRepository as any,
      aiService as any,
      guardrailsService as any,
    );
  });

  it('reuses an automatic message with the same idempotency key', async () => {
    const existingMessage = {
      id: 12,
      conversationId: 7,
      role: 'ASSISTANT',
      content: 'Apoio clínico',
      idempotencyKey: 'clinical-support:69:abc',
    };
    messagesRepository.findOneBy.mockResolvedValue(existingMessage);

    await expect(
      service.createMessage(7, {
        role: 'ASSISTANT',
        content: 'Apoio clínico',
        metadata: { idempotencyKey: 'clinical-support:69:abc' },
        generateAssistantResponse: false,
      }),
    ).resolves.toEqual({ message: existingMessage });

    expect(messagesRepository.save).not.toHaveBeenCalled();
  });

  it('persists an automatic message when its idempotency key is new', async () => {
    messagesRepository.findOneBy.mockResolvedValue(null);
    messagesRepository.save.mockImplementation(async (payload) => ({
      id: 13,
      ...payload,
    }));

    const result = await service.createMessage(7, {
      role: 'ASSISTANT',
      content: 'Novo apoio clínico',
      metadata: { idempotencyKey: 'clinical-support:69:def' },
      generateAssistantResponse: false,
    });

    expect(result.message.idempotencyKey).toBe('clinical-support:69:def');
    expect(messagesRepository.save).toHaveBeenCalledTimes(1);
  });

  it('returns the existing message after a concurrent unique-key collision', async () => {
    const existingMessage = {
      id: 14,
      conversationId: 7,
      role: 'ASSISTANT',
      content: 'Apoio clínico concorrente',
      idempotencyKey: 'clinical-support:69:ghi',
    };
    messagesRepository.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingMessage);
    messagesRepository.save.mockRejectedValue({ code: '23505' });

    await expect(
      service.createMessage(7, {
        role: 'ASSISTANT',
        content: 'Apoio clínico concorrente',
        metadata: { idempotencyKey: 'clinical-support:69:ghi' },
        generateAssistantResponse: false,
      }),
    ).resolves.toEqual({ message: existingMessage });
  });
});
