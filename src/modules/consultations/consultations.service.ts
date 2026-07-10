import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ConsultationsRepository } from './repositories/consultations.repository';
import {
  Consultation,
  ConsultationAiReviewAuditItem,
} from './entities/consultation.entity';
import { ConsultationProcedure } from '../consultation-procedures/entities/consultation-procedure.entity';
import { ConsultationDictationAiService } from '../consultation-dictations/consultation-dictation-ai.service';
import { SalesService } from '../sales/sales.service';
import { Appointment } from '../appointments/entities/appointment.entity';
import { AppointmentStatus } from '../appointment-statuses/entities/appointment-status.entity';

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly consultationDictationAiService: ConsultationDictationAiService,
    private readonly salesService: SalesService,
    private readonly dataSource: DataSource,
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

  async update(
    id: number,
    payload: any,
    currentUserId?: number,
  ): Promise<Consultation> {
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

  async finalizeAndBill(id: number, payload: any, currentUserId?: number) {
    return this.dataSource.transaction(async (manager) => {
      const consultationRepository = manager.getRepository(Consultation);
      const consultation = await consultationRepository
        .createQueryBuilder('consultation')
        .setLock('pessimistic_write')
        .where('consultation.id = :id', { id })
        .getOne();

      if (!consultation) {
        throw new NotFoundException(`Consultation ${id} not found`);
      }

      this.applyOriginalComplaintFallback(payload, consultation);
      this.applyAnamnesisApprovalAudit(payload, consultation, currentUserId);
      this.validateFinalizationPayload(
        { ...payload, recordStatus: 'FINALIZED' },
        consultation,
      );

      const merged = consultationRepository.merge(consultation, {
        ...payload,
        recordStatus: 'FINALIZED',
      });
      merged.recordStatus = 'FINALIZED';
      merged.finalizedAt = new Date();

      const savedConsultation = await consultationRepository.save(merged);
      await this.markAppointmentAsCompleted(
        manager,
        savedConsultation.appointmentId ?? null,
      );
      await this.syncBillingItemsFromPayload(
        manager,
        savedConsultation.id,
        payload,
      );

      const sale = await this.createSaleFromConsultationIfBillable(
        manager,
        savedConsultation,
      );

      return {
        consultation: savedConsultation,
        saleId: sale?.id ?? null,
        saleStatus: sale?.status ?? null,
        totalAmount: Number(sale?.totalAmount || 0),
        shouldOpenCheckout:
          sale?.status === 'OPEN' && Number(sale.totalAmount || 0) > 0,
      };
    });
  }

  private async createSaleFromConsultationIfBillable(
    manager: EntityManager,
    consultation: Consultation,
  ) {
    try {
      return await this.salesService.createOrSyncFromConsultation(
        manager,
        consultation,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message ===
          'Adicione ao menos um procedimento cobrável antes de finalizar e cobrar.'
      ) {
        return null;
      }
      throw error;
    }
  }

  private async syncBillingItemsFromPayload(
    manager: EntityManager,
    consultationId: number,
    payload: any,
  ) {
    const rawItems =
      payload?.billingItems ||
      payload?.consultationBillingItems ||
      payload?.consultationProcedures;
    if (!Array.isArray(rawItems)) return;

    const repository = manager.getRepository(ConsultationProcedure);

    for (const item of rawItems) {
      const procedureId = Number(item?.procedureId || 0);
      if (!procedureId) continue;

      const quantity = Math.max(0, Number(item?.quantity || 0));
      const unitPrice = this.normalizeMoney(item?.unitPrice || 0);
      const totalPrice = this.normalizeMoney(
        item?.totalPrice ?? quantity * unitPrice,
      );

      const existingId = Number(item?.id || 0);
      const existing = existingId
        ? await repository.findOne({
            where: { id: existingId, consultationId },
          })
        : null;

      const consultationProcedure =
        existing ||
        repository.create({
          consultationId,
        });

      consultationProcedure.procedureId = procedureId;
      consultationProcedure.quantity = quantity;
      consultationProcedure.unitPrice = unitPrice;
      consultationProcedure.totalPrice = totalPrice;

      await repository.save(consultationProcedure);
    }
  }

  private normalizeMoney(value: unknown) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount)) return 0;
    return Math.round(amount * 100) / 100;
  }

  private resolveRecordStatus(payload: any, consultation?: Consultation) {
    return String(payload?.recordStatus || consultation?.recordStatus || 'DRAFT')
      .trim()
      .toUpperCase();
  }

  private applyOriginalComplaintFallback(
    payload: any,
    consultation?: Consultation,
  ) {
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

    if (!merged.petId)
      throw new BadRequestException('Paciente é obrigatório para finalizar.');
    if (!merged.clientId)
      throw new BadRequestException('Tutor é obrigatório para finalizar.');
    if (!merged.veterinarianId) {
      throw new BadRequestException(
        'Veterinário responsável é obrigatório para finalizar.',
      );
    }
    if (!merged.visitDate) {
      throw new BadRequestException(
        'Data/hora do atendimento é obrigatória para finalizar.',
      );
    }
    if (!hasValue(merged.mainComplaint) && !hasValue(merged.clinicalFindings)) {
      throw new BadRequestException(
        'Queixa principal ou relato clínico é obrigatório para finalizar.',
      );
    }
    if (!hasValue(merged.treatmentPlan) && !hasValue(merged.notes)) {
      throw new BadRequestException(
        'Conduta ou justificativa clínica é obrigatória para finalizar.',
      );
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
      throw new BadRequestException(
        'Prescrição não pode estar vazia ao finalizar.',
      );
    }
    if (/Exames:/i.test(notes) && !exams) {
      throw new BadRequestException(
        'Exames solicitados precisam de descrição mínima.',
      );
    }
    if (
      inpatient &&
      !hasValue(getLineValue('Motivo internação')) &&
      !hasValue(exams)
    ) {
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

  private async markAppointmentAsCompleted(
    manager: EntityManager,
    appointmentId?: number | null,
  ) {
    if (!appointmentId) return;

    const appointmentRepository = manager.getRepository(Appointment);
    const appointment = await appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['status'],
    });

    if (!appointment) {
      return;
    }

    const currentStatusCode = String(appointment.status?.code || '').toUpperCase();
    if (currentStatusCode === 'CANCELED' || currentStatusCode === 'COMPLETED') {
      return;
    }

    const completedStatus = await manager.getRepository(AppointmentStatus).findOne({
      where: { code: 'COMPLETED' },
    });

    if (!completedStatus) {
      throw new BadRequestException('Status COMPLETED nao configurado.');
    }

    appointment.statusId = completedStatus.id;
    appointment.status = completedStatus;
    await appointmentRepository.save(appointment);
  }
}
