import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountsReceivableService } from './accounts-receivable.service';
import { CreateAccountReceivableDto } from './dto/create-account-receivable.dto';
import { UpdateAccountReceivableDto } from './dto/update-account-receivable.dto';
import { ReceiveAccountReceivableDto } from './dto/receive-account-receivable.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Accounts Receivable')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Permissions('financeiro.accounts_receivable.view')
@Controller('accounts-receivable')
export class AccountsReceivableController {
  constructor(
    private readonly accountsReceivableService: AccountsReceivableService,
  ) {}

  @Post()
  @Permissions('financeiro.accounts_receivable.create')
  @ApiOperation({ summary: 'Cadastrar nova conta a receber' })
  create(@Body() dto: CreateAccountReceivableDto) {
    return this.accountsReceivableService.create(dto);
  }

  @Patch(':id')
  @Permissions('financeiro.accounts_receivable.update')
  @ApiOperation({ summary: 'Atualizar conta a receber' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountReceivableDto,
  ) {
    return this.accountsReceivableService.update(id, dto);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Obter dados de resumo do dashboard operacional de contas a receber',
  })
  getDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('originType') originType?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.accountsReceivableService.getDashboardMetrics({
      startDate,
      endDate,
      status,
      originType,
      clientId: this.parseOptionalInt(clientId, 'clientId'),
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar contas a receber com filtros',
  })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('originType') originType?: string,
  ) {
    return this.accountsReceivableService.findAll({
      search,
      status,
      clientId: this.parseOptionalInt(clientId, 'clientId'),
      startDate,
      endDate,
      originType,
    });
  }

  @Patch(':id/receive')
  @Permissions('financeiro.accounts_receivable.receive')
  @ApiOperation({ summary: 'Registrar recebimento de uma conta' })
  markAsReceived(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReceiveAccountReceivableDto,
  ) {
    return this.accountsReceivableService.markAsReceived(id, dto);
  }

  @Patch(':id/undo-receive')
  @Permissions('financeiro.accounts_receivable.reverse')
  @ApiOperation({ summary: 'Estornar recebimento de uma conta manual' })
  undoReceive(@Param('id', ParseIntPipe) id: number) {
    return this.accountsReceivableService.undoReceive(id);
  }

  private parseOptionalInt(
    value: string | undefined,
    fieldName: string,
  ): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`${fieldName} must be a numeric string`);
    }

    return parsed;
  }
}
