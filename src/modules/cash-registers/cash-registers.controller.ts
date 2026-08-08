import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CashRegistersService } from './cash-registers.service';
import {
  CloseCashRegisterSessionDto,
  CreateTerminalDto,
  CreateThermalPrinterDto,
  OpenCashRegisterSessionDto,
  PrintRequestDto,
  UpdateTerminalDto,
  UpdateThermalPrinterDto,
  WithdrawCashDto,
} from './dto/cash-register.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('cash-registers')
@ApiBearerAuth()
@Controller('cash-registers')
@Permissions('financeiro.cash_registers.view')
export class CashRegistersController {
  constructor(private readonly service: CashRegistersService) {}

  @Get('terminals')
  findTerminals(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.service.findTerminals({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search,
      isActive,
      activeOnly,
    });
  }

  @Get('terminals/:id/opening-suggestion')
  openingSuggestion(@Param('id', ParseIntPipe) id: number) {
    return this.service.openingSuggestion(id);
  }

  @Post('terminals')
  @Permissions('financeiro.cash_registers.manage_terminals')
  createTerminal(@Body() payload: CreateTerminalDto) {
    return this.service.createTerminal(payload);
  }

  @Patch('terminals/:id')
  @Permissions('financeiro.cash_registers.manage_terminals')
  updateTerminal(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateTerminalDto,
  ) {
    return this.service.updateTerminal(id, payload);
  }

  @Get('printers')
  findPrinters(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.service.findPrinters({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search,
      isActive,
      activeOnly,
    });
  }

  @Post('printers')
  @Permissions('financeiro.cash_registers.manage_printers')
  createPrinter(@Body() payload: CreateThermalPrinterDto) {
    return this.service.createPrinter(payload);
  }

  @Patch('printers/:id')
  @Permissions('financeiro.cash_registers.manage_printers')
  updatePrinter(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateThermalPrinterDto,
  ) {
    return this.service.updatePrinter(id, payload);
  }

  @Get('sessions')
  findSessions(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('terminalId') terminalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findSessions({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
      terminalId: terminalId ? Number(terminalId) : undefined,
      startDate,
      endDate,
    });
  }

  @Get('sessions/current')
  @Permissions('financeiro.cash_registers.current')
  findCurrentSession(
    @Req() req: any,
    @Query('terminalId') terminalId?: string,
  ) {
    return this.service.findCurrentSession(
      Number(req.user?.userId),
      terminalId ? Number(terminalId) : undefined,
    );
  }

  @Post('sessions/open')
  @Permissions('financeiro.cash_registers.open')
  openSession(@Body() payload: OpenCashRegisterSessionDto, @Req() req: any) {
    return this.service.openSession(payload, Number(req.user?.userId));
  }

  @Get('sessions/:id/summary')
  sessionSummary(@Param('id', ParseIntPipe) id: number) {
    return this.service.sessionSummary(id);
  }

  @Get('sessions/:id/movements')
  @Permissions('financeiro.cash_registers.movements')
  listMovements(@Param('id', ParseIntPipe) id: number) {
    return this.service.listMovements(id);
  }

  @Post('sessions/:id/withdraw')
  @Permissions('financeiro.cash_registers.withdraw')
  withdraw(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: WithdrawCashDto,
    @Req() req: any,
  ) {
    return this.service.withdraw(id, payload, Number(req.user?.userId));
  }

  @Post('sessions/:id/close')
  @Permissions('financeiro.cash_registers.close')
  closeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CloseCashRegisterSessionDto,
    @Req() req: any,
  ) {
    return this.service.closeSession(id, payload, Number(req.user?.userId));
  }

  @Post('sessions/:id/print-opening')
  @Permissions('financeiro.cash_registers.print_opening')
  printOpening(@Param('id', ParseIntPipe) id: number) {
    void id;
    return {
      message: 'Impressão de abertura será renderizada pelo fluxo de caixa.',
    };
  }

  @Post('sessions/:id/print-closing')
  @Permissions('financeiro.cash_registers.print_closing')
  printClosing(@Param('id', ParseIntPipe) id: number) {
    void id;
    return {
      message: 'Impressão de fechamento será renderizada pelo fluxo de caixa.',
    };
  }
}
