import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Zoetis', description: 'Nome do fornecedor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Zoetis Industria de Produtos Veterinarios Ltda',
    description: 'Razao social',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  legalName?: string;

  @ApiPropertyOptional({
    example: '12345678000199',
    description: 'CPF/CNPJ do fornecedor (somente numeros)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  document?: string;

  @ApiPropertyOptional({ example: 'contato@fornecedor.com' })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    example: 'Fornecedor homologado para compras recorrentes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
