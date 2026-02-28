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
  @ApiOperation({ summary: 'Cria uma nova categoria de produto' })
  @ApiOkResponse({ type: ProductCategory })
  create(@Body() payload: any) {
    return this.productCategoriesService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Lista categorias com paginação' })
  findAll(@Query() query: any) {
    return this.productCategoriesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma categoria por ID' })
  @ApiOkResponse({ type: ProductCategory })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productCategoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma categoria' })
  @ApiOkResponse({ type: ProductCategory })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.productCategoriesService.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma categoria' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productCategoriesService.remove(id);
  }
}
