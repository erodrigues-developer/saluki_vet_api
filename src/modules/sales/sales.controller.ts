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
import { SalesService } from './sales.service';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Sale } from './entities/sale.entity';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova venda' })
  @ApiOkResponse({ type: Sale })
  create(@Body() createDto: any) {
    return this.salesService.create(createDto);
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
