import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsString,
  MaxLength,
} from 'class-validator';

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
  @IsNotEmpty()
  @MaxLength(50)
  paymentMethod: string;
}
