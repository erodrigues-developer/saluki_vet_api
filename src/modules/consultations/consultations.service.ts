import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConsultationsRepository } from './repositories/consultations.repository';
import {
  Consultation,
  ConsultationAiReviewAuditItem,
} from './entities/consultation.entity';
import { ConsultationDictationAiService } from '../consultation-dictations/consultation-dictation-ai.service';

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly consultationDictationAiService: ConsultationDictationAiService,
  ) {}

  async approveAnamnesis(
    id: number,
    payload: { anamnesisText?: string } = {},
    currentUserId?: number,
  ): Promise<Consultation> {
    const consultation = await this.findOne(id);
    const anamnesisText = String(
      payload.anamnesisText ||
        consultation.aiOrganizedComplaint ||
        consultation.mainComplaint ||
        '',
    ).trim();
    if (!anamnesisText) {
      throw new BadRequestException('Anamnese vazia. Não é possível aprovar.');
    }

    const consultiveSupportText =
      await this.consultationDictationAiService.buildConsultiveSupport({
        anamnesis: anamnesisText,
        weightKg: consultation.weightKg ?? null,
        temperatureC: consultation.temperatureC ?? null,
      });

    const merged = this.consultationsRepository.merge(consultation, {
      aiOrganizedComplaint: anamnesisText,
      mainComplaint: anamnesisText,
      assistedAnamnesisSummary: anamnesisText,
      clinicalFindings: anamnesisText,
      anamnesisApproved: true,
      anamnesisApprovedAt: new Date(),
      anamnesisApprovedByUserId: currentUserId ?? null,
      consultiveSupportText,
      consultiveSupportGeneratedAt: new Date(),
    } as any);

    return this.consultationsRepository.save(merged);
  }

  async create(payload: any, currentUserId?: number): Promise<Consultation> {
    this.applyOriginalComplaintFallback(payload);
    this.applyAnamnesisApprovalAudit(payload, undefined, currentUserId);
    this.validateFinalizationPayload(payload);
    const consultation = this.consultationsRepository.create({
      ...payload,
    } as any);
    return this.consultationsRepository.save(consultation as any);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    petId?: number;
    clientId?: number;
    veterinarianId?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;
    const sortBy = params.sortBy || 'visitDate';
    const sortDirection =
      params.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [data, total] = await this.consultationsRepository.findPaginated({
      page,
      limit,
      petId: params.petId ? Number(params.petId) : undefined,
      clientId: params.clientId ? Number(params.clientId) : undefined,
      veterinarianId: params.veterinarianId
        ? Number(params.veterinarianId)
        : undefined,
      sortBy,
      sortDirection,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(id: number): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findOne({
      where: { id },
    });
    if (!consultation) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }
    return consultation;
  }

  async update(id: number, payload: any, currentUserId?: number): Promise<Consultation> {
    const consultation = await this.findOne(id);
    this.applyOriginalComplaintFallback(payload, consultation);
    this.applyAnamnesisApprovalAudit(payload, consultation, currentUserId);
    this.validateFinalizationPayload(payload, consultation);
    const merged = this.consultationsRepository.merge(consultation, payload);
    if (this.resolveRecordStatus(payload, consultation) === 'FINALIZED') {
      merged.recordStatus = 'FINALIZED';
      merged.finalizedAt = new Date();
    }
    return this.consultationsRepository.save(merged);
  }

  private resolveRecordStatus(payload: any, consultation?: Consultation) {
    return String(payload?.recordStatus || consultation?.recordStatus || 'DRAFT')
      .trim()
      .toUpperCase();
  }

  private applyOriginalComplaintFallback(payload: any, consultation?: Consultation) {
    if (payload?.originalComplaint) return;
    if (consultation?.originalComplaint) return;
    const transcriptDraft = String(payload?.transcriptDraft || '').trim();
    if (!transcriptDraft) return;
    payload.originalComplaint = transcriptDraft;
    payload.migratedFromLegacyFlow = true;
  }

  private validateFinalizationPayload(payload: any, consultation?: Consultation) {
    const recordStatus = this.resolveRecordStatus(payload, consultation);
    if (recordStatus !== 'FINALIZED') return;

    const merged = { ...(consultation || {}), ...(payload || {}) };
    const hasValue = (value: unknown) => String(value || '').trim().length > 0;

    if (!merged.petId) throw new BadRequestException('Paciente é obrigatório para finalizar.');
    if (!merged.clientId) throw new BadRequestException('Tutor é obrigatório para finalizar.');
    if (!merged.veterinarianId) {
      throw new BadRequestException('Veterinário responsável é obrigatório para finalizar.');
    }
    if (!merged.visitDate) {
      throw new BadRequestException('Data/hora do atendimento é obrigatória para finalizar.');
    }
    if (!hasValue(merged.mainComplaint) && !hasValue(merged.clinicalFindings)) {
      throw new BadRequestException(
        'Queixa principal ou relato clínico é obrigatório para finalizar.',
      );
    }
    if (!hasValue(merged.treatmentPlan) && !hasValue(merged.notes)) {
      throw new BadRequestException('Conduta ou justificativa clínica é obrigatória para finalizar.');
    }
    if (hasValue(merged.aiOrganizedComplaint) && !merged.anamnesisApproved) {
      throw new BadRequestException(
        'A anamnese organizada por IA precisa ser aprovada antes da finalização.',
      );
    }

    const notes = String(merged.notes || '');
    const getLineValue = (label: string) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = notes.match(new RegExp(`${escaped}:\\s*(.+)`));
      return match?.[1]?.trim() || '';
    };

    const prescription = getLineValue('Prescrição');
    const exams = getLineValue('Exames');
    const inpatient = /Encaminhar para internação:\s*Sim/i.test(notes);
    if (/Prescrição:/i.test(notes) && !prescription) {
      throw new BadRequestException('Prescrição não pode estar vazia ao finalizar.');
    }
    if (/Exames:/i.test(notes) && !exams) {
      throw new BadRequestException('Exames solicitados precisam de descrição mínima.');
    }
    if (inpatient && !hasValue(getLineValue('Motivo internação')) && !hasValue(exams)) {
      throw new BadRequestException(
        'Encaminhamento para internação exige motivo/observação mínima.',
      );
    }

    this.ensureAppliedAiBlocksWereReviewed(merged.aiReviewAudit);
  }

  private ensureAppliedAiBlocksWereReviewed(auditItems: unknown) {
    if (!Array.isArray(auditItems) || !auditItems.length) return;
    const items = auditItems as ConsultationAiReviewAuditItem[];
    const blocked = items.find(
      (item) =>
        ['anamnesis'].includes(String(item.blockType || '')) &&
        ['pending'].includes(String(item.action || '').toLowerCase()) &&
        String(item.finalText || '').trim().length > 0,
    );

    if (blocked) {
      throw new BadRequestException(
        'Há informações da IA aplicadas ao prontuário sem confirmação do veterinário.',
      );
    }
  }

  private applyAnamnesisApprovalAudit(
    payload: any,
    consultation?: Consultation,
    currentUserId?: number,
  ) {
    const merged = { ...(consultation || {}), ...(payload || {}) };
    const isApproved = Boolean(merged.anamnesisApproved);
    const wasApproved = Boolean(consultation?.anamnesisApproved);

    if (isApproved && !wasApproved) {
      payload.anamnesisApprovedAt = payload?.anamnesisApprovedAt || new Date();
      payload.anamnesisApprovedByUserId =
        payload?.anamnesisApprovedByUserId ?? currentUserId ?? null;
      return;
    }

    if (!isApproved) {
      payload.anamnesisApprovedAt = null;
      payload.anamnesisApprovedByUserId = null;
      payload.consultiveSupportText = null;
      payload.consultiveSupportGeneratedAt = null;
    }
  }
}
