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

export class TransferInpatientRecordDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  boxId: number;

  @ApiProperty({ example: 'Paciente precisa de isolamento respiratorio.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  reason: string;

  @ApiPropertyOptional({ example: '2026-06-07T14:30:00.000Z' })
  @IsDateString()
  @IsOptional()
  transferredAt?: string;
}
