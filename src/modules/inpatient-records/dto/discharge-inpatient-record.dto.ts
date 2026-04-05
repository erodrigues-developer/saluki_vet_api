import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class DischargeInpatientRecordDto {
  @ApiPropertyOptional({ example: '2026-04-05T18:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  dischargeAt?: string;

  @ApiPropertyOptional({ example: 'Paciente estavel, alta com orientacoes.' })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  notes?: string;
}
