import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { SaleItemsService } from './sale-items.service';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SaleItem } from './entities/sale-item.entity';

@ApiTags('sale-items')
@ApiBearerAuth()
@Controller('sale-items')
export class SaleItemsController {
  constructor(private readonly saleItemsService: SaleItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Adicionar produto/serviço a uma venda' })
  @ApiOkResponse({ type: SaleItem })
  create(@Body() createDto: any) {
    return this.saleItemsService.create(createDto);
  }

  @Get('sale/:saleId')
  @ApiOperation({ summary: 'Listar itens de uma venda específica' })
  @ApiOkResponse({ type: [SaleItem] })
  findBySale(@Param('saleId') saleId: string) {
    return this.saleItemsService.findBySale(+saleId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um item da venda' })
  remove(@Param('id') id: string) {
    return this.saleItemsService.remove(+id);
  }
}
