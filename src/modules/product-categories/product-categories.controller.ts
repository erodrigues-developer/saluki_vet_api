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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductCategoriesService } from './product-categories.service';
import { ProductCategory } from './entities/product-category.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Product Categories')
@ApiBearerAuth()
@Controller({
  path: 'product-categories',
  version: '1',
})
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  @Post()
  @Permissions('cadastros.product_categories.create')
  @ApiOperation({ summary: 'Cria uma nova categoria de produto' })
  @ApiOkResponse({ type: ProductCategory })
  create(@Body() payload: any) {
    return this.productCategoriesService.create(payload);
  }

  @Get()
  @Permissions(
    'cadastros.product_categories.view',
    'cadastros.products.view',
    'estoque.balances.view',
  )
  @ApiOperation({ summary: 'Lista categorias com paginação' })
  findAll(@Query() query: any) {
    return this.productCategoriesService.findAll(query);
  }

  @Get(':id')
  @Permissions(
    'cadastros.product_categories.view',
    'cadastros.products.view',
    'estoque.balances.view',
  )
  @ApiOperation({ summary: 'Busca uma categoria por ID' })
  @ApiOkResponse({ type: ProductCategory })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productCategoriesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('cadastros.product_categories.update')
  @ApiOperation({ summary: 'Atualiza uma categoria' })
  @ApiOkResponse({ type: ProductCategory })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.productCategoriesService.update(id, payload);
  }

  @Delete(':id')
  @Permissions('cadastros.product_categories.delete')
  @ApiOperation({ summary: 'Remove uma categoria' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productCategoriesService.remove(id);
  }
}
