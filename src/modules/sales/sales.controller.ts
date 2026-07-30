import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Sale } from './entities/sale.entity';
import { CheckoutSaleDto } from './dto/checkout-sale.dto';
import { CheckoutSaleResponseDto } from './dto/checkout-sale-response.dto';
import { CashRegistersService } from '../cash-registers/cash-registers.service';
import { PrintRequestDto } from '../cash-registers/dto/cash-register.dto';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly cashRegistersService: CashRegistersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova venda' })
  @ApiOkResponse({ type: Sale })
  create(@Body() createDto: any, @Req() req: any) {
    return this.salesService.create(createDto, Number(req.user?.userId));
  }

  @Post(':id/checkout')
  @ApiOperation({
    summary:
      'Realizar checkout transacional da venda (pagamento + contas a receber + baixa da venda)',
  })
  @ApiOkResponse({ type: CheckoutSaleResponseDto })
  checkout(
    @Param('id', ParseIntPipe) id: number,
    @Body() checkoutDto: CheckoutSaleDto,
    @Req() req: any,
  ): Promise<CheckoutSaleResponseDto> {
    return this.salesService.checkout(id, checkoutDto, Number(req.user?.userId));
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar venda' })
  @ApiOkResponse({ type: Sale })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.cancel(id);
  }

  @Post(':id/undo-checkout')
  @ApiOperation({ summary: 'Estornar pagamento de venda paga' })
  @ApiOkResponse({ type: Sale })
  undoCheckout(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.salesService.undoCheckout(id, Number(req.user?.userId));
  }

  @Get(':id/receipt-preview')
  @ApiOperation({ summary: 'Gerar pré-visualização do cupom não fiscal' })
  receiptPreview(@Param('id', ParseIntPipe) id: number) {
    return this.cashRegistersService.receiptPreview(id);
  }

  @Post(':id/print-receipt')
  @ApiOperation({ summary: 'Criar job de impressão do cupom não fiscal' })
  printReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: PrintRequestDto,
    @Req() req: any,
  ) {
    return this.cashRegistersService.printSaleReceipt(
      id,
      payload,
      Number(req.user?.userId),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar vendas com filtros e paginação' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('clientId') clientId?: number,
    @Query('veterinarianId') veterinarianId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.findAll({
      page: +page || 1,
      limit: +limit || 10,
      status,
      clientId: clientId ? +clientId : undefined,
      veterinarianId: veterinarianId ? +veterinarianId : undefined,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma venda pelo ID com itens e pagamentos' })
  @ApiOkResponse({ type: Sale })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma venda' })
  @ApiOkResponse({ type: Sale })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.salesService.update(+id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma venda' })
  remove(@Param('id') id: string) {
    return this.salesService.remove(+id);
  }
}
