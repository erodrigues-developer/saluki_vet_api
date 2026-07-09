import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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

export class CreateAccountReceivableDto {
  @ApiProperty({ example: 'Recebimento de hospedagem' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiPropertyOptional({ example: 1, description: 'ID do cliente vinculado' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  clientId?: number;

  @ApiProperty({ example: 250.0 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: Date;

  @ApiPropertyOptional({ example: 'Cliente solicitou envio de boleto por WhatsApp' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsString()
  @IsOptional()
  documentUrl?: string;
}
