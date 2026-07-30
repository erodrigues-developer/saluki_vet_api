import { Transform, Type } from 'class-transformer';
import {
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const toMoneyNumber = ({ value }: { value: unknown }) =>
  value === null || value === undefined || value === ''
    ? value
    : Number(Number(value).toFixed(2));

export class CheckoutSalePaymentDto {
  @ApiProperty({ example: 1, description: 'ID da forma de pagamento ativa' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  paymentMethodId: number;

  @ApiProperty({ example: 150.5, description: 'Valor pago nesta forma' })
  @Transform(toMoneyNumber)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: 200,
    required: false,
    description:
      'Valor entregue pelo cliente nesta forma. Usado para calcular troco em dinheiro.',
  })
  @Transform(toMoneyNumber)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  tenderedAmount?: number;
}

export class CheckoutSaleDto {
  @ApiProperty({
    type: [CheckoutSalePaymentDto],
    required: false,
    description:
      'Pagamentos do checkout. Quando informado, substitui paymentMethodId/amount.',
  })
  @ValidateNested({ each: true })
  @Type(() => CheckoutSalePaymentDto)
  @ArrayMinSize(1)
  @IsOptional()
  payments?: CheckoutSalePaymentDto[];

  @ApiProperty({
    example: 1,
    required: false,
    description: 'ID da forma de pagamento ativa',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  paymentMethodId?: number;

  @ApiProperty({
    example: 1,
    description: 'ID da sessão de caixa aberta usada no recebimento',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  cashRegisterSessionId: number;

  @ApiProperty({
    example: 150.5,
    required: false,
    description:
      'Valor pago em checkout simples. Em múltiplos pagamentos, use payments[].amount.',
  })
  @Transform(toMoneyNumber)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  amount?: number;

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
