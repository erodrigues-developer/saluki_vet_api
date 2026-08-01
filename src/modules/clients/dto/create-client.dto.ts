import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
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
  @Transform(({ value }) => (value === '' ? null : value))
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ example: 'PF', required: false, nullable: true })
  @IsString()
  @IsOptional()
  @IsIn(['PF', 'PJ'])
  @MaxLength(10)
  personType?: string | null;

  @ApiProperty({ example: 'ISENTO', required: false, nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  stateTaxId?: string | null;

  @ApiProperty({ example: '123456', required: false, nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  municipalTaxId?: string | null;

  @ApiProperty({ example: 'NON_TAXPAYER', required: false, nullable: true })
  @IsString()
  @IsOptional()
  @IsIn(['TAXPAYER', 'EXEMPT', 'NON_TAXPAYER'])
  @MaxLength(30)
  stateTaxpayerType?: string | null;

  @ApiProperty({ example: '123456789', required: false, nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  suframa?: string | null;

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

  @ApiProperty({ example: '3550308', required: false, nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  ibgeCityCode?: string | null;

  @ApiProperty({ example: '1058', required: false, nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(4)
  countryCode?: string | null;

  @ApiProperty({ example: 'Brasil', required: false, nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  countryName?: string | null;

  @ApiProperty({ example: 'fiscal@email.com', required: false, nullable: true })
  @Transform(({ value }) => (value === '' ? null : value))
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  taxEmail?: string | null;

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
