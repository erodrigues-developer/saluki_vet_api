import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateAccountPayableDto {
  @ApiProperty({ example: 'Conta de Energia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiPropertyOptional({ example: 'Enel' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  supplierName?: string;

  @ApiPropertyOptional({ example: 'Custos Fixos' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ example: 150.5 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: Date;

  @ApiPropertyOptional({ example: 'Multa aplicável após 5 dias' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsString()
  @IsOptional()
  documentUrl?: string;
}
