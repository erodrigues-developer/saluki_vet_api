import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTreatmentItemDto {
  @ApiProperty({ example: '2026-04-05T22:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  medicamentId?: number;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  procedureId?: number;

  @ApiPropertyOptional({ example: '1 comprimido VO' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  dose?: string;

  @ApiPropertyOptional({ example: 'Administrar apos alimentacao.' })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  notes?: string;
}
