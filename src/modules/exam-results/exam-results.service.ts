import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamResult } from './entities/exam-result.entity';
import { ExamRequest } from '../exam-requests/entities/exam-request.entity';
import { FileStorageService } from '../file-storage/file-storage.service';
import { CreateExamResultDto } from './dto/create-exam-result.dto';
import { FilterExamResultsDto } from './dto/filter-exam-results.dto';

@Injectable()
export class ExamResultsService {
  constructor(
    @InjectRepository(ExamResult)
    private readonly examResultsRepository: Repository<ExamResult>,
    @InjectRepository(ExamRequest)
    private readonly examRequestsRepository: Repository<ExamRequest>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async create(
    payload: CreateExamResultDto,
    file: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    } | undefined,
    currentUserId: number | null | undefined,
    requestBaseUrl: string,
  ) {
    const examRequestId = Number(payload.examRequestId);
    if (!Number.isFinite(examRequestId) || examRequestId <= 0) {
      throw new BadRequestException('examRequestId inválido.');
    }

    const examRequest = await this.examRequestsRepository.findOne({
      where: { id: examRequestId },
    });
    if (!examRequest) {
      throw new NotFoundException(`Exam request ${examRequestId} not found`);
    }

    const resultData = String(payload.resultData || '').trim() || null;
    if (!file && !resultData) {
      throw new BadRequestException(
        'Envie um arquivo ou informe o resultado textual do exame.',
      );
    }

    let uploaded:
      | {
          fileUrl: string;
          storageKey: string;
          originalName: string;
          mimeType: string;
          fileSize: number;
        }
      | undefined;

    if (file) {
      uploaded = await this.fileStorageService.uploadBinaryFile(file, {
        folder: 'exam-results',
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
    }

    const completedAt = payload.completedAt
      ? new Date(payload.completedAt)
      : new Date();
    if (Number.isNaN(completedAt.getTime())) {
      throw new BadRequestException('completedAt inválido.');
    }

    const entity = this.examResultsRepository.create({
      examRequestId,
      resultData,
      fileUrl: uploaded?.fileUrl || null,
      storageKey: uploaded?.storageKey || null,
      originalName: uploaded?.originalName || null,
      mimeType: uploaded?.mimeType || null,
      fileSize: uploaded?.fileSize || null,
      notes: String(payload.notes || '').trim() || null,
      completedAt,
      veterinarianId: currentUserId ?? null,
    });

    const saved = await this.examResultsRepository.save(entity);
    await this.examRequestsRepository.update(examRequestId, {
      status: 'COMPLETED',
    });

    return this.examResultsRepository.findOne({
      where: { id: saved.id },
      relations: [
        'examRequest',
        'examRequest.examType',
        'examRequest.examType.examCategory',
        'veterinarian',
      ],
    });
  }

  async findAll(filters: FilterExamResultsDto) {
    const query = this.examResultsRepository
      .createQueryBuilder('examResult')
      .leftJoinAndSelect('examResult.examRequest', 'examRequest')
      .leftJoinAndSelect('examRequest.examType', 'examType')
      .leftJoinAndSelect('examType.examCategory', 'examCategory')
      .leftJoinAndSelect('examRequest.consultation', 'consultation')
      .leftJoinAndSelect('examRequest.pet', 'pet')
      .leftJoinAndSelect('pet.client', 'client')
      .leftJoinAndSelect('examResult.veterinarian', 'veterinarian')
      .orderBy('examResult.completedAt', 'DESC')
      .addOrderBy('examResult.id', 'DESC');

    if (filters.consultationId) {
      query.andWhere('examRequest.consultationId = :consultationId', {
        consultationId: Number(filters.consultationId),
      });
    }
    if (filters.examRequestId) {
      query.andWhere('examResult.examRequestId = :examRequestId', {
        examRequestId: Number(filters.examRequestId),
      });
    }

    return { data: await query.getMany() };
  }
}
