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
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentMethod } from './entities/payment-method.entity';

@ApiTags('payment-methods')
@ApiBearerAuth()
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova forma de pagamento' })
  @ApiOkResponse({ type: PaymentMethod })
  create(@Body() createDto: any) {
    return this.paymentMethodsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar formas de pagamento' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('q') q?: string,
  ) {
    return this.paymentMethodsService.findAll({ page: +page || 1, limit: +limit || 10, q });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma forma de pagamento pelo ID' })
  @ApiOkResponse({ type: PaymentMethod })
  findOne(@Param('id') id: string) {
    return this.paymentMethodsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma forma de pagamento' })
  @ApiOkResponse({ type: PaymentMethod })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.paymentMethodsService.update(+id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma forma de pagamento' })
  remove(@Param('id') id: string) {
    return this.paymentMethodsService.remove(+id);
  }
}
