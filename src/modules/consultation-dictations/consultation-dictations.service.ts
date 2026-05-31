import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Consultation } from '../consultations/entities/consultation.entity';
import { ConsultationDictationAiService } from './consultation-dictation-ai.service';
import { CreateConsultationDictationDto } from './dto/create-consultation-dictation.dto';
import { FilterConsultationDictationsDto } from './dto/filter-consultation-dictations.dto';
import { ConsultationDictation } from './entities/consultation-dictation.entity';

@Injectable()
export class ConsultationDictationsService {
  private readonly logger = new Logger(ConsultationDictationsService.name);
  private isProcessingQueue = false;

  constructor(
    @InjectRepository(ConsultationDictation)
    private readonly consultationDictationsRepository: Repository<ConsultationDictation>,
    @InjectRepository(Consultation)
    private readonly consultationsRepository: Repository<Consultation>,
    private readonly consultationDictationAiService: ConsultationDictationAiService,
  ) {}

  async create(
    consultationId: number,
    payload: CreateConsultationDictationDto,
    audioFile?: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
    currentUserId?: number,
  ) {
    await this.ensureConsultationExists(consultationId);

    const transcriptDraft = this.normalizeFreeText(payload.transcriptDraft);
    const hasUploadedAudio = Boolean(audioFile?.buffer?.length);

    if (!hasUploadedAudio && transcriptDraft.length < 10) {
      throw new BadRequestException(
        'Transcript draft precisa ter ao menos 10 caracteres validos quando nenhum audio e enviado',
      );
    }

    if (!hasUploadedAudio) {
      const existingEquivalent = await this.findEquivalentManualDictation(
        consultationId,
        transcriptDraft,
      );
      if (existingEquivalent) {
        return this.findOne(existingEquivalent.id);
      }
    }

    const entity = this.consultationDictationsRepository.create({
      consultationId,
      createdByUserId: currentUserId ?? null,
      captureSource: payload.captureSource ?? 'MANUAL_TEXT',
      language: payload.language?.trim() || 'pt-BR',
      audioDurationSeconds: payload.audioDurationSeconds ?? null,
      transcriptDraft,
      audioFileName: hasUploadedAudio
        ? audioFile?.originalname?.trim() || null
        : null,
      audioMimeType: hasUploadedAudio
        ? audioFile?.mimetype?.trim() || null
        : null,
      audioBlob: hasUploadedAudio ? audioFile?.buffer || null : null,
      status: 'PENDING',
    });

    const saved = await this.consultationDictationsRepository.save(entity);
    void this.processPendingQueue(1).catch((error) => {
      this.logger.error(
        `Failed to schedule consultation dictation ${saved.id}`,
        error?.stack,
      );
    });
    return this.findOne(saved.id);
  }

  async findAll(
    consultationId: number,
    filters: FilterConsultationDictationsDto = {},
  ) {
    await this.ensureConsultationExists(consultationId);

    const where: Record<string, any> = { consultationId };
    if (filters.status) {
      where.status = filters.status;
    }

    return {
      data: await this.consultationDictationsRepository.find({
        where,
        relations: {
          createdByUser: true,
        },
        order: {
          createdAt: 'DESC',
          id: 'DESC',
        },
      }),
    };
  }

  async findOne(id: number) {
    const dictation = await this.consultationDictationsRepository.findOne({
      where: { id },
      relations: {
        createdByUser: true,
      },
    });

    if (!dictation) {
      throw new NotFoundException(`Consultation dictation ${id} not found`);
    }

    return dictation;
  }

  @Cron('*/5 * * * * *')
  async handleQueueTick() {
    await this.processPendingQueue();
  }

  async processPendingQueue(limit = 5) {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const pendingItems = await this.consultationDictationsRepository
        .createQueryBuilder('dictation')
        .addSelect('dictation.audioBlob')
        .where('dictation.status IN (:...statuses)', { statuses: ['PENDING'] })
        .orderBy('dictation.createdAt', 'ASC')
        .addOrderBy('dictation.id', 'ASC')
        .take(limit)
        .getMany();

      for (const dictation of pendingItems) {
        await this.processSingleDictation(dictation);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async processSingleDictation(dictation: ConsultationDictation) {
    dictation.status = 'PROCESSING';
    dictation.failureReason = null;
    dictation.processingStartedAt = new Date();
    dictation.processingAttempts =
      Number(dictation.processingAttempts || 0) + 1;
    await this.consultationDictationsRepository.save(dictation);

    try {
      let transcriptDraft = this.normalizeFreeText(dictation.transcriptDraft);

      if (dictation.audioBlob?.length) {
        const transcribedAudio =
          await this.consultationDictationAiService.transcribeAudio(
            dictation.audioBlob,
            {
              fileName: dictation.audioFileName,
              mimeType: dictation.audioMimeType,
              language: dictation.language,
              fallbackTranscript: transcriptDraft || null,
            },
          );

        transcriptDraft = this.normalizeFreeText(transcribedAudio);
        dictation.transcriptDraft = transcriptDraft;
      }

      if (transcriptDraft.length < 10) {
        throw new BadRequestException(
          'Nao foi possivel obter uma transcricao valida para o ditado enviado',
        );
      }

      const structured =
        await this.consultationDictationAiService.buildStructuredDraft(
          transcriptDraft,
        );

      dictation.status = 'COMPLETED';
      dictation.transcriptDraft = transcriptDraft;
      dictation.transcriptFinal = structured.cleanedTranscript;
      dictation.structuredPayload = structured.payload;
      dictation.processedAt = new Date();
      await this.consultationDictationsRepository.save(dictation);
      await this.syncConsultationAnamnesisFromDictation(dictation);
    } catch (error: any) {
      dictation.status = 'FAILED';
      dictation.failureReason =
        error?.message || 'Falha inesperada ao processar o ditado';
      dictation.processedAt = new Date();
      await this.consultationDictationsRepository.save(dictation);
      this.logger.error(
        `Failed to process consultation dictation ${dictation.id}`,
        error?.stack,
      );
    }
  }

  private async ensureConsultationExists(consultationId: number) {
    const consultation = await this.consultationsRepository.findOneBy({
      id: consultationId,
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation ${consultationId} not found`);
    }

    return consultation;
  }

  private normalizeFreeText(value: string) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  private async findEquivalentManualDictation(
    consultationId: number,
    transcriptDraft: string,
  ) {
    const normalizedDraft = this.normalizeFreeText(transcriptDraft);
    if (!normalizedDraft) return null;

    const recent = await this.consultationDictationsRepository.find({
      where: {
        consultationId,
        captureSource: 'MANUAL_TEXT',
        status: In(['PENDING', 'PROCESSING', 'COMPLETED']),
      },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: 5,
    });

    return (
      recent.find(
        (item) =>
          this.normalizeFreeText(
            item.transcriptDraft || item.transcriptFinal || '',
          ) === normalizedDraft,
      ) || null
    );
  }

  private async syncConsultationAnamnesisFromDictation(
    dictation: ConsultationDictation,
  ) {
    const consultation = await this.consultationsRepository.findOneBy({
      id: dictation.consultationId,
    });
    if (!consultation) return;

    const transcript = this.normalizeFreeText(
      dictation.transcriptDraft || dictation.transcriptFinal || '',
    );
    if (transcript) {
      const timestamp = new Date().toISOString();
      const separator = `\n\n[${timestamp}] ---\n`;
      const original = String(consultation.originalComplaint || '').trim();
      const normalizedOriginal = this.normalizeFreeText(original);
      const normalizedTranscript = this.normalizeFreeText(transcript);
      if (!normalizedOriginal) {
        consultation.originalComplaint = transcript;
      } else if (!normalizedOriginal.includes(normalizedTranscript)) {
        consultation.originalComplaint = `${original}${separator}${transcript}`;
      }
    }

    const structured = dictation.structuredPayload;
    const organizedText = this.normalizeFreeText(
      String(
        dictation.transcriptFinal ||
          structured?.mainComplaint ||
          structured?.subjective ||
          structured?.summary ||
          '',
      ),
    );
    if (organizedText) {
      consultation.aiOrganizedComplaint = organizedText;
      consultation.mainComplaint = organizedText;
      consultation.assistedAnamnesisSummary = organizedText;
      consultation.clinicalFindings = organizedText;
      consultation.anamnesisApproved = false;
      consultation.anamnesisApprovedAt = null;
      consultation.anamnesisApprovedByUserId = null;
    }

    await this.consultationsRepository.save(consultation);
  }
}
