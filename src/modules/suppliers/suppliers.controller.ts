import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { FilterSuppliersDto } from './dto/filter-suppliers.dto';
import { Supplier } from './entities/supplier.entity';
import { PaginatedSuppliersResponseDto } from './dto/paginated-suppliers-response.dto';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller({
  path: 'suppliers',
  version: '1',
})
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um fornecedor' })
  @ApiCreatedResponse({
    description: 'Fornecedor criado com sucesso',
    type: Supplier,
  })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista fornecedores com filtros e paginacao',
    description: 'Permite busca por nome/documento e filtro por status ativo.',
  })
  @ApiOkResponse({
    description: 'Lista paginada de fornecedores',
    type: PaginatedSuppliersResponseDto,
  })
  @ApiQuery({ name: 'search', required: false, example: 'zoe' })
  @ApiQuery({ name: 'isActive', required: false, example: true })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  findAll(@Query() query: FilterSuppliersDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca fornecedor por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: Supplier })
  @ApiNotFoundResponse({ description: 'Fornecedor nao encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um fornecedor' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: Supplier })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiNotFoundResponse({ description: 'Fornecedor nao encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Inativa um fornecedor' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Fornecedor inativado' })
  @ApiNotFoundResponse({ description: 'Fornecedor nao encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.suppliersService.remove(id);
  }
}
