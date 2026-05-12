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

export class CreatePrescriptionDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  petId: number;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  consultationId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Usado apenas quando admin emite em nome de outro vet.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  veterinarianId?: number;

  @ApiProperty({ example: 'Dipirona 1 gota/kg VO a cada 8h por 5 dias.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content: string;

  @ApiPropertyOptional({ example: '2026-05-05' })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional({ example: '2026-04-05T18:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  prescribedAt?: string;
}
