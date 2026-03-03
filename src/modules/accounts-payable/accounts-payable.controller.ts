import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsPayableService } from './accounts-payable.service';
import { CreateAccountPayableDto } from './dto/create-account-payable.dto';
import { PayAccountDto } from './dto/pay-account.dto';
import { UpdateAccountPayableDto } from './dto/update-account-payable.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Accounts Payable')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('accounts-payable')
export class AccountsPayableController {
  constructor(private readonly service: AccountsPayableService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar nova conta a pagar' })
  create(@Body() dto: CreateAccountPayableDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta a pagar' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountPayableDto,
  ) {
    return this.service.update(id, dto);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Obter dados dos gráficos e KPIs do dashboard financeiro',
  })
  async getDashboard(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.service.getDashboardMetrics(
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
      category,
      status,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar contas a pagar com filtros' })
  async findAll(
    @Query('category') category?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.service.findAll(
      category,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
      status,
    );
    return { data };
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Registrar pagamento de uma conta' })
  markAsPaid(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PayAccountDto,
  ) {
    return this.service.markAsPaid(id, dto);
  }

  @Patch(':id/undo-pay')
  @ApiOperation({ summary: 'Estornar pagamento de uma conta' })
  undoPayment(@Param('id', ParseIntPipe) id: number) {
    return this.service.undoPayment(id);
  }
}
