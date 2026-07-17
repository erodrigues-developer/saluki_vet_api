import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateClinicSettingsDto {
  @ApiPropertyOptional({ example: 'Clínica Veterinária Saluki' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Saluki' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  shortName?: string;

  @ApiPropertyOptional({ example: 'Rua das Acácias' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  street?: string;

  @ApiPropertyOptional({ example: '120' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  number?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  district?: string;

  @ApiPropertyOptional({ example: 'Sala 2' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  complement?: string;

  @ApiPropertyOptional({ example: '01310-000' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsString()
  @IsOptional()
  @Length(2, 2)
  state?: string;

  @ApiPropertyOptional({ example: '12.345.678/0001-90' })
  @IsString()
  @IsOptional()
  @Length(18, 18)
  cnpj?: string;

  @ApiPropertyOptional({ example: '(11) 3333-4444' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: '(11) 99999-8888' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'contato@saluki.vet' })
  @IsEmail()
  @IsOptional()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsInt()
  @Min(1)
  @IsOptional()
  appointmentSlotDurationMinutes?: number;

  @ApiPropertyOptional({ example: '{"seg": ["08:00-18:00"]}' })
  @IsString()
  @IsOptional()
  businessHoursJson?: string;

  @ApiPropertyOptional({ example: '#2563EB' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'primaryColor must be a valid hex color' })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#0F172A' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'secondaryColor must be a valid hex color' })
  secondaryColor?: string;

  @ApiPropertyOptional({ example: 'Bem-vindo à clínica.' })
  @IsString()
  @IsOptional()
  loginMessage?: string;

  @ApiPropertyOptional({ example: 'BRL' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  defaultCurrency?: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @Min(0)
  @IsOptional()
  checkInToleranceMinutes?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsInt()
  @Min(1)
  @IsOptional()
  accountsPayableRecurrenceHorizonMonths?: number;

  @ApiPropertyOptional({ example: 'Novas notas' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'Dra. Ana Souza' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  technicalResponsibleName?: string;

  @ApiPropertyOptional({ example: '12345' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  technicalResponsibleCrmv?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsString()
  @IsOptional()
  @Length(2, 2)
  technicalResponsibleCrmvUf?: string;
}
