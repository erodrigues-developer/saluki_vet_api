import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultationAttachment } from './entities/consultation-attachment.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { CreateConsultationAttachmentDto } from './dto/create-consultation-attachment.dto';
import { FileStorageService } from '../file-storage/file-storage.service';
import { normalizeFileNameEncoding } from '../../common/utils/file-name-encoding.util';

@Injectable()
export class ConsultationAttachmentsService {
  constructor(
    @InjectRepository(ConsultationAttachment)
    private readonly consultationAttachmentsRepository: Repository<ConsultationAttachment>,
    @InjectRepository(Consultation)
    private readonly consultationsRepository: Repository<Consultation>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async create(
    consultationId: number,
    payload: CreateConsultationAttachmentDto,
    file: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
    currentUserId: number | null | undefined,
    requestBaseUrl: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    const consultation = await this.consultationsRepository.findOne({
      where: { id: consultationId },
    });
    if (!consultation) {
      throw new NotFoundException(`Consultation ${consultationId} not found`);
    }

    const uploaded = await this.fileStorageService.uploadBinaryFile(file, {
      folder: 'consultations/attachments',
      requestBaseUrl,
      allowedMimePrefixes: ['image/', 'text/'],
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      maxFileSizeBytes: 10 * 1024 * 1024,
    });

    const entity = this.consultationAttachmentsRepository.create({
      consultationId,
      petId: Number(consultation.petId),
      clientId: Number(consultation.clientId),
      uploadedByUserId: currentUserId ?? null,
      attachmentType: String(payload.attachmentType || 'DOCUMENT')
        .trim()
        .toUpperCase(),
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      fileSize: uploaded.fileSize,
      storageKey: uploaded.storageKey,
      fileUrl: uploaded.fileUrl,
      notes: String(payload.notes || '').trim() || null,
    });

    return this.consultationAttachmentsRepository.save(entity);
  }

  async findAll(consultationId: number) {
    await this.ensureConsultationExists(consultationId);

    const attachments = await this.consultationAttachmentsRepository.find({
      where: { consultationId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });

    return {
      data: attachments.map((attachment) => ({
        ...attachment,
        originalName: normalizeFileNameEncoding(attachment.originalName),
      })),
    };
  }

  async remove(id: number) {
    const attachment = await this.consultationAttachmentsRepository.findOne({
      where: { id },
    });
    if (!attachment) {
      throw new NotFoundException(`Consultation attachment ${id} not found`);
    }

    await this.consultationAttachmentsRepository.softDelete(id);
  }

  private async ensureConsultationExists(consultationId: number) {
    const consultation = await this.consultationsRepository.findOne({
      where: { id: consultationId },
    });
    if (!consultation) {
      throw new NotFoundException(`Consultation ${consultationId} not found`);
    }
  }
}
