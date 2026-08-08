import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Permissions('cadastros.products.create')
  @ApiOperation({ summary: 'Cria um novo produto/serviço' })
  @ApiOkResponse({ type: Product })
  create(@Body() payload: any) {
    return this.productsService.create(payload);
  }

  @Post('upload-image')
  @Permissions('cadastros.products.create', 'cadastros.products.update')
  @ApiOperation({ summary: 'Faz upload de imagem de produto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadImage(
    @UploadedFile()
    file?: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
    @Req() req?: any,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem nao enviado.');
    }

    const requestBaseUrl = `${req?.protocol || 'http'}://${req?.get?.('host') || 'localhost:3000'}`;
    return this.productsService.uploadImage(file, requestBaseUrl);
  }

  @Get()
  @Permissions(
    'cadastros.products.view',
    'atendimentos.inpatient_records.view',
    'atendimentos.consultations.view',
    'atendimentos.consultations.create',
    'financeiro.sales.view',
    'financeiro.sales.create',
    'estoque.balances.view',
    'estoque.movements.view',
  )
  @ApiOperation({ summary: 'Lista produtos com paginação e filtros' })
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @Permissions(
    'cadastros.products.view',
    'atendimentos.inpatient_records.view',
    'atendimentos.consultations.view',
    'atendimentos.consultations.create',
    'financeiro.sales.view',
    'financeiro.sales.create',
    'estoque.balances.view',
    'estoque.movements.view',
  )
  @ApiOperation({ summary: 'Busca um produto por ID' })
  @ApiOkResponse({ type: Product })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('cadastros.products.update')
  @ApiOperation({ summary: 'Atualiza um produto' })
  @ApiOkResponse({ type: Product })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.productsService.update(id, payload);
  }

  @Delete(':id')
  @Permissions('cadastros.products.delete')
  @ApiOperation({ summary: 'Remove (soft delete) um produto' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
