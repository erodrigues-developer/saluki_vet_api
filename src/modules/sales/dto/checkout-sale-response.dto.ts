import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSaleResponseDto {
  @ApiProperty({ example: 10 })
  saleId: number;

  @ApiProperty({ example: 'PAID' })
  saleStatus: string;

  @ApiProperty({ example: 120 })
  paymentId: number;

  @ApiProperty({ example: 88 })
  accountReceivableId: number;

  @ApiProperty({ example: 1 })
  paymentMethodId: number;

  @ApiProperty({ example: 150.5 })
  amount: number;

  @ApiProperty({ example: '2026-03-02T18:30:00.000Z' })
  paidAt: string;

  @ApiProperty({ example: '2026-03-02' })
  dueDate: string;

  @ApiProperty({ example: 'Recebimento da venda #10' })
  description: string;
}
