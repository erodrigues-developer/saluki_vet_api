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

@ApiTags('cash-registers')
@ApiBearerAuth()
@Controller('cash-registers')
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
  createTerminal(@Body() payload: CreateTerminalDto) {
    return this.service.createTerminal(payload);
  }

  @Patch('terminals/:id')
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
  createPrinter(@Body() payload: CreateThermalPrinterDto) {
    return this.service.createPrinter(payload);
  }

  @Patch('printers/:id')
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
  openSession(@Body() payload: OpenCashRegisterSessionDto, @Req() req: any) {
    return this.service.openSession(payload, Number(req.user?.userId));
  }

  @Get('sessions/:id/summary')
  sessionSummary(@Param('id', ParseIntPipe) id: number) {
    return this.service.sessionSummary(id);
  }

  @Get('sessions/:id/movements')
  listMovements(@Param('id', ParseIntPipe) id: number) {
    return this.service.listMovements(id);
  }

  @Post('sessions/:id/withdraw')
  withdraw(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: WithdrawCashDto,
    @Req() req: any,
  ) {
    return this.service.withdraw(id, payload, Number(req.user?.userId));
  }

  @Post('sessions/:id/close')
  closeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CloseCashRegisterSessionDto,
    @Req() req: any,
  ) {
    return this.service.closeSession(id, payload, Number(req.user?.userId));
  }

  @Post('sessions/:id/print-opening')
  printOpening(@Param('id', ParseIntPipe) id: number) {
    void id;
    return {
      message: 'Impressão de abertura será renderizada pelo fluxo de caixa.',
    };
  }

  @Post('sessions/:id/print-closing')
  printClosing(@Param('id', ParseIntPipe) id: number) {
    void id;
    return {
      message: 'Impressão de fechamento será renderizada pelo fluxo de caixa.',
    };
  }
}
