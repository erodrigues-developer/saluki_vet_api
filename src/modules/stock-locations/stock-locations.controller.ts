import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StockLocation } from './entities/stock-location.entity';
import { StockLocationsService } from './stock-locations.service';

@ApiTags('stock-locations')
@ApiBearerAuth()
@Controller('stock-locations')
export class StockLocationsController {
  constructor(private readonly stockLocationsService: StockLocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar local de estoque' })
  @ApiOkResponse({ type: StockLocation })
  create(@Body() payload: any) {
    return this.stockLocationsService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Listar locais de estoque' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    if (activeOnly === 'true') {
      return this.stockLocationsService.findActiveOptions();
    }

    return this.stockLocationsService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search,
      isActive,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar local de estoque por ID' })
  @ApiOkResponse({ type: StockLocation })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stockLocationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar local de estoque' })
  @ApiOkResponse({ type: StockLocation })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.stockLocationsService.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir local de estoque' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.stockLocationsService.remove(id);
  }
}
