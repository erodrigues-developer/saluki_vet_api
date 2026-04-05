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

export class CreateInpatientRecordDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  petId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  boxId: number;

  @ApiPropertyOptional({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  consultationId?: number;

  @ApiPropertyOptional({ example: 'Pos-operatorio ortopedico' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: '2026-04-05T15:30:00.000Z' })
  @IsDateString()
  @IsOptional()
  admissionAt?: string;

  @ApiPropertyOptional({ example: 'Monitorar dor e apetite.' })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  notes?: string;
}
