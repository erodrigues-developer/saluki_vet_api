import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSaleDto {
  @ApiProperty({ example: 1, description: 'ID da forma de pagamento ativa' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  paymentMethodId: number;

  @ApiProperty({
    example: 150.5,
    description: 'Valor pago. Nesta story, deve ser igual ao total da venda',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: '2026-03-02T18:30:00.000Z',
    description: 'Timestamp do pagamento em ISO 8601',
  })
  @IsDateString()
  @IsNotEmpty()
  paidAt: string;

  @ApiProperty({
    example: 'Pagamento integral no balcao',
    required: false,
    description: 'Observacao opcional para conciliacao do checkout',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
