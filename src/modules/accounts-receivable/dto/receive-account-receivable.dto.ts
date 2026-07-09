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

export class ReceiveAccountReceivableDto {
  @ApiProperty({ example: '2024-07-15T12:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  paidAt: Date;

  @ApiProperty({ example: 250.0 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  paidAmount: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  paymentMethodId: number;

  @ApiPropertyOptional({ example: 'Recebido via Pix no balcão' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  note?: string;
}
