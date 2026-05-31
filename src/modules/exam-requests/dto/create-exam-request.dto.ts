import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateExamRequestDto {
  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  consultationId?: number;

  @ApiProperty({ example: 33 })
  @IsInt()
  @Min(1)
  petId: number;

  @ApiProperty({ example: [1, 3, 9], type: [Number] })
  @IsArray()
  examTypeIds: number[];

  @ApiPropertyOptional({ example: 'Jejum de 8 horas antes da coleta.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ example: '2026-05-30T20:15:00.000Z' })
  @IsOptional()
  @IsDateString()
  requestedAt?: string;
}
