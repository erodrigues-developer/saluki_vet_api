import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ConsultationDictationCaptureSource } from '../entities/consultation-dictation.entity';

const CAPTURE_SOURCE_ENUM: Record<
  ConsultationDictationCaptureSource,
  ConsultationDictationCaptureSource
> = {
  MANUAL_TEXT: 'MANUAL_TEXT',
  BROWSER_AUDIO: 'BROWSER_AUDIO',
  BROWSER_SPEECH: 'BROWSER_SPEECH',
};

export class CreateConsultationDictationDto {
  @ApiProperty({
    example:
      'Tutor relata vomito desde ontem. Temperatura 39.4. Suspeita de gastroenterite.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  transcriptDraft?: string;

  @ApiPropertyOptional({
    enum: ['MANUAL_TEXT', 'BROWSER_AUDIO', 'BROWSER_SPEECH'],
  })
  @IsOptional()
  @IsEnum(CAPTURE_SOURCE_ENUM)
  captureSource?: ConsultationDictationCaptureSource;

  @ApiPropertyOptional({ example: 'pt-BR' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 95 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7200)
  audioDurationSeconds?: number;
}
