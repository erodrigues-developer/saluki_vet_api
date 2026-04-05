import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccountsReceivableService } from './accounts-receivable.service';

@ApiTags('accounts-receivable')
@ApiBearerAuth()
@Controller('accounts-receivable')
export class AccountsReceivableController {
  constructor(
    private readonly accountsReceivableService: AccountsReceivableService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar contas a receber com filtros por status, periodo, cliente e venda',
  })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
    @Query('clientId', new ParseIntPipe({ optional: true })) clientId?: number,
    @Query('saleId', new ParseIntPipe({ optional: true })) saleId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountsReceivableService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
      clientId,
      saleId,
      startDate,
      endDate,
    });
  }
}
