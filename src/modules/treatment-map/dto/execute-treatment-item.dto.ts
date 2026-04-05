import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ExecuteTreatmentItemDto {
  @ApiPropertyOptional({ example: '2026-04-05T22:05:00.000Z' })
  @IsDateString()
  @IsOptional()
  executedAt?: string;

  @ApiPropertyOptional({ example: 'Paciente aceitou bem a medicacao.' })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  notes?: string;
}
