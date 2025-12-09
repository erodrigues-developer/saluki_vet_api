import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    example: 'Maria Souza',
    description: 'Nome completo do cliente',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: '12345678900',
    description: 'Documento (CPF/CNPJ)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  document?: string;

  @ApiProperty({
    example: '+55 11 4002-8922',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({
    example: '+55 11 99999-9999',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  mobilePhone?: string;

  @ApiProperty({
    example: 'maria.souza@email.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ example: 'Av. Paulista', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  street?: string;

  @ApiProperty({ example: '1000', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  number?: string;

  @ApiProperty({ example: 'Apto 42', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  complement?: string;

  @ApiProperty({ example: 'Bela Vista', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  district?: string;

  @ApiProperty({ example: 'São Paulo', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  city?: string;

  @ApiProperty({ example: 'SP', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  state?: string;

  @ApiProperty({ example: '01310-000', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  zipCode?: string;

  @ApiProperty({
    example: 'Prefere ser avisada via WhatsApp',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
