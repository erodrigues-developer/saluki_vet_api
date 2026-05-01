import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Consultation } from '../consultations/entities/consultation.entity';
import { ConsultationDictationAiService } from './consultation-dictation-ai.service';
import { ConsultationDictationsService } from './consultation-dictations.service';
import { ConsultationDictation } from './entities/consultation-dictation.entity';

describe('ConsultationDictationsService', () => {
  let service: ConsultationDictationsService;

  const consultationRepository = {
    findOneBy: jest.fn(),
  };

  const dictationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const consultationDictationAiService = {
    buildStructuredDraft: jest.fn(),
    transcribeAudio: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    consultationDictationAiService.buildStructuredDraft.mockResolvedValue({
      cleanedTranscript:
        'Tutor relata vomito e apatia desde ontem. Ao exame temperatura 39,4 e desidratacao leve. Suspeita de gastroenterite aguda. Conduta com antiemetico, dieta leve e retorno em 48 horas.',
      payload: {
        summary: 'Suspeita de gastroenterite aguda com conduta sintomatica.',
        subjective: 'Vomito e apatia desde ontem.',
        objective: 'Temperatura 39,4 e desidratacao leve.',
        assessment: 'Suspeita de gastroenterite aguda.',
        plan: 'Antiemetico, dieta leve e retorno em 48 horas.',
        mainComplaint: 'Vomito e apatia desde ontem.',
        clinicalFindings: 'Temperatura 39,4 e desidratacao leve.',
        diagnosis: 'Suspeita de gastroenterite aguda.',
        treatmentPlan: 'Antiemetico, dieta leve e retorno em 48 horas.',
        notes: null,
        weightKg: null,
        temperatureC: 39.4,
        keywords: ['vomito', 'apatia', 'gastroenterite'],
      },
    });
    consultationDictationAiService.transcribeAudio.mockResolvedValue(
      'Tutor relata vomito e apatia desde ontem. Ao exame temperatura 39,4 e desidratacao leve. Suspeita de gastroenterite aguda. Conduta com antiemetico, dieta leve e retorno em 48 horas.',
    );
    dictationRepository.createQueryBuilder.mockImplementation(() => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }));

    const moduleRef = await Test.createTestingModule({
      providers: [
        ConsultationDictationsService,
        {
          provide: getRepositoryToken(ConsultationDictation),
          useValue: dictationRepository,
        },
        {
          provide: getRepositoryToken(Consultation),
          useValue: consultationRepository,
        },
        {
          provide: ConsultationDictationAiService,
          useValue: consultationDictationAiService,
        },
      ],
    }).compile();

    service = moduleRef.get(ConsultationDictationsService);
  });

  it('should create pending dictation and normalize input', async () => {
    consultationRepository.findOneBy.mockResolvedValue({ id: 12 });
    dictationRepository.find.mockResolvedValue([]);
    dictationRepository.create.mockImplementation((payload: any) => payload);
    dictationRepository.save.mockResolvedValue({
      id: 9,
      consultationId: 12,
      status: 'PENDING',
    });
    dictationRepository.findOne.mockResolvedValue({
      id: 9,
      consultationId: 12,
      transcriptDraft: 'Tutor relata vomito desde ontem',
      status: 'PENDING',
    });

    const result = await service.create(
      12,
      {
        transcriptDraft: ' Tutor relata   vomito desde ontem ',
        captureSource: 'MANUAL_TEXT',
      },
      undefined,
      3,
    );

    expect(dictationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        consultationId: 12,
        createdByUserId: 3,
        transcriptDraft: 'Tutor relata vomito desde ontem',
        status: 'PENDING',
      }),
    );
    expect(result.id).toBe(9);
  });

  it('should create pending dictation with uploaded audio even without transcript draft', async () => {
    consultationRepository.findOneBy.mockResolvedValue({ id: 12 });
    dictationRepository.create.mockImplementation((payload: any) => payload);
    dictationRepository.save.mockResolvedValue({
      id: 10,
      consultationId: 12,
      status: 'PENDING',
    });
    dictationRepository.findOne.mockResolvedValue({
      id: 10,
      consultationId: 12,
      transcriptDraft: '',
      status: 'PENDING',
    });

    const result = await service.create(
      12,
      {
        captureSource: 'BROWSER_AUDIO',
      },
      {
        buffer: Buffer.from('fake-audio'),
        originalname: 'consulta.webm',
        mimetype: 'audio/webm',
      },
      3,
    );

    expect(dictationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        consultationId: 12,
        createdByUserId: 3,
        transcriptDraft: '',
        audioFileName: 'consulta.webm',
        audioMimeType: 'audio/webm',
        audioBlob: expect.any(Buffer),
        status: 'PENDING',
      }),
    );
    expect(result.id).toBe(10);
  });

  it('should process transcript into structured payload through AI service', async () => {
    const pendingEntity = {
      id: 88,
      consultationId: 12,
      status: 'PENDING',
      processingAttempts: 0,
      transcriptDraft:
        'Tutor relata vomito e apatia desde ontem. Ao exame temperatura 39,4 e desidratacao leve. Suspeita de gastroenterite aguda. Conduta com antiemetico, dieta leve e retorno em 48 horas.',
    } as ConsultationDictation;

    dictationRepository.createQueryBuilder.mockImplementation(() => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([pendingEntity]),
    }));
    dictationRepository.save.mockImplementation(
      async (payload: any) => payload,
    );

    await service.processPendingQueue(5);

    expect(
      consultationDictationAiService.buildStructuredDraft,
    ).toHaveBeenCalledWith(pendingEntity.transcriptDraft);
    expect(dictationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 88,
        status: 'COMPLETED',
        transcriptFinal: expect.any(String),
        structuredPayload: expect.objectContaining({
          mainComplaint: expect.stringContaining('Vomito'),
          clinicalFindings: expect.stringContaining('39,4'),
          diagnosis: expect.stringContaining('gastroenterite'),
          treatmentPlan: expect.stringContaining('retorno'),
          temperatureC: 39.4,
        }),
      }),
    );
  });

  it('should transcribe uploaded audio before structuring payload', async () => {
    const pendingEntity = {
      id: 89,
      consultationId: 12,
      status: 'PENDING',
      processingAttempts: 0,
      transcriptDraft: '',
      language: 'pt-BR',
      audioFileName: 'consulta.webm',
      audioMimeType: 'audio/webm',
      audioBlob: Buffer.from('fake-audio'),
    } as ConsultationDictation;

    dictationRepository.createQueryBuilder = jest.fn(() => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([pendingEntity]),
    }));
    dictationRepository.save.mockImplementation(
      async (payload: any) => payload,
    );

    await service.processPendingQueue(5);

    expect(consultationDictationAiService.transcribeAudio).toHaveBeenCalledWith(
      pendingEntity.audioBlob,
      expect.objectContaining({
        fileName: 'consulta.webm',
        mimeType: 'audio/webm',
        language: 'pt-BR',
        fallbackTranscript: null,
      }),
    );
    expect(
      consultationDictationAiService.buildStructuredDraft,
    ).toHaveBeenCalledWith(expect.stringContaining('Tutor relata vomito'));
  });
});
