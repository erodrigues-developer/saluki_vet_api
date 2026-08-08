import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentMethod } from './entities/payment-method.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('payment-methods')
@ApiBearerAuth()
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @Permissions('cadastros.payment_methods.create')
  @ApiOperation({ summary: 'Criar uma nova forma de pagamento' })
  @ApiOkResponse({ type: PaymentMethod })
  create(@Body() createDto: any) {
    return this.paymentMethodsService.create(createDto);
  }

  @Get()
  @Permissions(
    'cadastros.payment_methods.view',
    'financeiro.sales.view',
    'financeiro.sales.create',
    'financeiro.cash_registers.view',
    'financeiro.accounts_payable.view',
    'financeiro.accounts_receivable.view',
  )
  @ApiOperation({ summary: 'Listar formas de pagamento' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('q') q?: string,
  ) {
    return this.paymentMethodsService.findAll({
      page: +page || 1,
      limit: +limit || 10,
      q,
    });
  }

  @Get(':id')
  @Permissions(
    'cadastros.payment_methods.view',
    'financeiro.sales.view',
    'financeiro.sales.create',
    'financeiro.cash_registers.view',
    'financeiro.accounts_payable.view',
    'financeiro.accounts_receivable.view',
  )
  @ApiOperation({ summary: 'Buscar uma forma de pagamento pelo ID' })
  @ApiOkResponse({ type: PaymentMethod })
  findOne(@Param('id') id: string) {
    return this.paymentMethodsService.findOne(+id);
  }

  @Patch(':id')
  @Permissions('cadastros.payment_methods.update')
  @ApiOperation({ summary: 'Atualizar uma forma de pagamento' })
  @ApiOkResponse({ type: PaymentMethod })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.paymentMethodsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Permissions('cadastros.payment_methods.delete')
  @ApiOperation({ summary: 'Remover uma forma de pagamento' })
  remove(@Param('id') id: string) {
    return this.paymentMethodsService.remove(+id);
  }
}
