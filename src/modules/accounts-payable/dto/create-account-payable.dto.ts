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
import { ValidateNested } from 'class-validator';
import { AccountPayableRecurrenceDto } from './account-payable-recurrence.dto';

export class CreateAccountPayableDto {
  @ApiProperty({ example: 'Conta de Energia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiPropertyOptional({ example: 1, description: 'ID do fornecedor vinculado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplierId?: number;

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

  @ApiPropertyOptional({ example: 7, description: 'Profissional beneficiário' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  beneficiaryUserId?: number;

  @ApiPropertyOptional({ example: 'COMMISSION_PAYOUT' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  originType?: string;

  @ApiPropertyOptional({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  originReferenceId?: number;

  @ApiPropertyOptional({ type: () => AccountPayableRecurrenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccountPayableRecurrenceDto)
  recurrence?: AccountPayableRecurrenceDto;
}
