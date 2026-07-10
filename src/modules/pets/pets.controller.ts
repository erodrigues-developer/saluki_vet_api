import {
  BadRequestException,
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
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { FilterPetsDto } from './dto/filter-pets.dto';
import { Pet } from './entities/pet.entity';
import { PaginatedPetsResponseDto } from './dto/paginated-pets-response.dto';

@ApiTags('Pets')
@ApiBearerAuth()
@Controller({
  path: 'pets',
  version: '1',
})
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um pet' })
  @ApiCreatedResponse({
    description: 'Pet criado com sucesso',
    type: Pet,
  })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  create(@Body() createPetDto: CreatePetDto) {
    return this.petsService.create(createPetDto);
  }

  @Post('upload-photo')
  @ApiOperation({ summary: 'Faz upload de foto do pet' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
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
  uploadPhoto(
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
      throw new BadRequestException('Arquivo de imagem não enviado.');
    }

    const requestBaseUrl = `${req?.protocol || 'http'}://${req?.get?.('host') || 'localhost:3000'}`;
    return this.petsService.uploadPhoto(file, requestBaseUrl);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista pets com filtros e paginação',
    description:
      'Filtra por nome, clientId e microchipCode. Permite ordenação/paginação.',
  })
  @ApiOkResponse({
    description: 'Lista paginada de pets',
    type: PaginatedPetsResponseDto,
  })
  @ApiQuery({ name: 'name', required: false, example: 'Thor' })
  @ApiQuery({ name: 'clientId', required: false, example: 1 })
  @ApiQuery({ name: 'microchipCode', required: false, example: 'MC-123' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'createdAt',
    description: 'name | clientId | microchipCode | createdAt | updatedAt',
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    example: 'desc',
    description: 'asc | desc',
  })
  findAll(@Query() query: FilterPetsDto) {
    return this.petsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um pet por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Pet encontrado', type: Pet })
  @ApiNotFoundResponse({ description: 'Pet não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.petsService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Retorna histórico consolidado do pet' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Histórico consolidado do pet' })
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.petsService.getHistory(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um pet' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Pet atualizado', type: Pet })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiNotFoundResponse({ description: 'Pet não encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePetDto: UpdatePetDto,
  ) {
    return this.petsService.update(id, updatePetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove (soft delete) um pet' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Pet removido' })
  @ApiNotFoundResponse({ description: 'Pet não encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.petsService.remove(id);
  }
}
