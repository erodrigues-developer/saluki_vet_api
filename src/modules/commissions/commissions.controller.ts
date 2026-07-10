import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { PreviewCommissionPayoutDto } from './dto/preview-commission-payout.dto';
import { PayAccountDto } from '../accounts-payable/dto/pay-account.dto';

@ApiTags('commissions')
@ApiBearerAuth()
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  private parseOptionalInt(value?: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(
        'Validation failed (numeric string is expected)',
      );
    }
    return parsed;
  }

  @Get()
  @ApiOperation({
    summary: 'Listar carteira de comissoes por profissional, status e periodo',
  })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('saleId') saleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.commissionsService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
      userId: this.parseOptionalInt(userId),
      saleId: this.parseOptionalInt(saleId),
      startDate,
      endDate,
    });
  }

  @Get('summary')
  @ApiOperation({
    summary:
      'Obter totais pendentes e pagos de comissoes por filtros administrativos',
  })
  getSummary(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('saleId') saleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.commissionsService.getSummary({
      status,
      userId: this.parseOptionalInt(userId),
      saleId: this.parseOptionalInt(saleId),
      startDate,
      endDate,
    });
  }

  @Get('payouts')
  @ApiOperation({
    summary: 'Listar pagamentos de comissão gerados',
  })
  findPayouts(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.commissionsService.findPayouts({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
      userId: this.parseOptionalInt(userId),
      startDate,
      endDate,
    });
  }

  @Get('payouts/:id')
  @ApiOperation({
    summary: 'Obter um pagamento de comissão com itens e conta a pagar vinculada',
  })
  findPayout(@Param('id', ParseIntPipe) id: number) {
    return this.commissionsService.findPayoutById(id);
  }

  @Post('payouts/preview')
  @ApiOperation({
    summary: 'Pré-visualizar o pagamento de comissão antes da geração',
  })
  previewPayout(@Body() payload: PreviewCommissionPayoutDto) {
    return this.commissionsService.previewPayout(payload);
  }

  @Post('payouts')
  @ApiOperation({
    summary: 'Gerar pagamento de comissão e sua conta a pagar correspondente',
  })
  createPayout(@Body() payload: PreviewCommissionPayoutDto) {
    return this.commissionsService.createPayout(payload);
  }

  @Post('payouts/:id/pay')
  @ApiOperation({
    summary: 'Registrar o pagamento de um lote de comissão',
  })
  payPayout(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: PayAccountDto,
  ) {
    return this.commissionsService.payPayout(id, payload);
  }

  @Post('payouts/:id/undo-pay')
  @ApiOperation({
    summary: 'Estornar o pagamento de um lote de comissão',
  })
  undoPayoutPayment(@Param('id', ParseIntPipe) id: number) {
    return this.commissionsService.undoPayoutPayment(id);
  }
}
