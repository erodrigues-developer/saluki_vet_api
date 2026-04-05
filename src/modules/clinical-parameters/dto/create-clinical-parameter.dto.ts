import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateClinicalParameterDto {
  @ApiPropertyOptional({ example: '2026-04-05T16:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  measuredAt?: string;

  @ApiPropertyOptional({ example: 38.5 })
  @IsNumber()
  @IsOptional()
  temperatureC?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsInt()
  @IsOptional()
  heartRateBpm?: number;

  @ApiPropertyOptional({ example: 28 })
  @IsInt()
  @IsOptional()
  respiratoryRateMpm?: number;

  @ApiPropertyOptional({ example: '120/80' })
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @ApiPropertyOptional({ example: 12.4 })
  @IsNumber()
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({ example: 'Paciente alerta e responsivo.' })
  @IsString()
  @IsOptional()
  notes?: string;
}
