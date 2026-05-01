import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ConsultationDictationStatus } from '../entities/consultation-dictation.entity';

const DICTATION_STATUS_ENUM: Record<
  ConsultationDictationStatus,
  ConsultationDictationStatus
> = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

export class FilterConsultationDictationsDto {
  @ApiPropertyOptional({
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
  })
  @IsOptional()
  @IsEnum(DICTATION_STATUS_ENUM)
  status?: ConsultationDictationStatus;
}
