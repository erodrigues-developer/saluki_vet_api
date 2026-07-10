import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConsultationAttachmentDto {
  @ApiProperty({ required: false, example: 'DOCUMENT' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  attachmentType?: string;

  @ApiProperty({ required: false, example: 'Arquivo enviado pelo tutor' })
  @IsOptional()
  @IsString()
  notes?: string;
}
