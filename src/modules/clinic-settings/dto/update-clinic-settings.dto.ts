import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateClinicSettingsDto {
  @ApiPropertyOptional({ example: 30 })
  @IsInt()
  @Min(1)
  @IsOptional()
  appointmentSlotDurationMinutes?: number;

  @ApiPropertyOptional({ example: '{"seg": ["08:00-18:00"]}' })
  @IsString()
  @IsOptional()
  businessHoursJson?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'BRL' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  defaultCurrency?: string;

  @ApiPropertyOptional({ example: 'Novas notas' })
  @IsString()
  @IsOptional()
  notes?: string;
}
