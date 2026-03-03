import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountPayableDto {
  @ApiProperty({ example: 'Conta de Energia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: 1, description: 'ID do fornecedor vinculado' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  supplierId: number;

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
