import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Payment } from './entities/payment.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
@Permissions('financeiro.payments.view')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Permissions('financeiro.payments.create')
  @ApiOperation({ summary: 'Registrar um pagamento para uma venda' })
  @ApiOkResponse({ type: Payment })
  create(@Body() createDto: any) {
    return this.paymentsService.create(createDto);
  }

  @Get('sale/:saleId')
  @ApiOperation({ summary: 'Listar pagamentos de uma venda' })
  @ApiOkResponse({ type: [Payment] })
  findBySale(@Param('saleId') saleId: string) {
    return this.paymentsService.findBySale(+saleId);
  }

  @Delete(':id')
  @Permissions('financeiro.payments.reverse')
  @ApiOperation({ summary: 'Remover um registro de pagamento' })
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }
}
