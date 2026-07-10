import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PayAccountDto {
  @ApiProperty({ example: '2024-07-15T12:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  paidAt: Date;

  @ApiProperty({ example: 150.5 })
  @IsNumber()
  @IsNotEmpty()
  paidAmount: number;

  @ApiProperty({ example: 'PIX' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  paymentMethodId?: number;
}
