import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConsultationDictationsService } from './consultation-dictations.service';
import { CreateConsultationDictationDto } from './dto/create-consultation-dictation.dto';
import { FilterConsultationDictationsDto } from './dto/filter-consultation-dictations.dto';
import { ConsultationDictation } from './entities/consultation-dictation.entity';

@ApiTags('Consultation Dictations')
@ApiBearerAuth()
@Controller({
  path: 'consultations/:consultationId/dictations',
  version: '1',
})
export class ConsultationDictationsController {
  constructor(
    private readonly consultationDictationsService: ConsultationDictationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo ditado clinico para uma consulta' })
  @ApiParam({ name: 'consultationId', type: Number })
  @ApiCreatedResponse({ type: ConsultationDictation })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transcriptDraft: { type: 'string', nullable: true },
        captureSource: {
          type: 'string',
          enum: ['MANUAL_TEXT', 'BROWSER_AUDIO', 'BROWSER_SPEECH'],
        },
        language: { type: 'string', example: 'pt-BR' },
        audioDurationSeconds: { type: 'integer', example: 95 },
        audioFile: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('audioFile', {
      storage: memoryStorage(),
      limits: {
        fileSize: 12 * 1024 * 1024,
      },
    }),
  )
  create(
    @Param('consultationId', ParseIntPipe) consultationId: number,
    @Body() payload: CreateConsultationDictationDto,
    @Req() req: any,
    @UploadedFile()
    audioFile?: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
  ) {
    if (audioFile && !audioFile.buffer?.length) {
      throw new BadRequestException('Arquivo de audio recebido sem conteudo');
    }

    return this.consultationDictationsService.create(
      consultationId,
      payload,
      audioFile,
      req.user?.userId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os ditados clinicos associados a uma consulta',
  })
  @ApiParam({ name: 'consultationId', type: Number })
  @ApiOkResponse({ type: ConsultationDictation, isArray: true })
  findAll(
    @Param('consultationId', ParseIntPipe) consultationId: number,
    @Query() query: FilterConsultationDictationsDto,
  ) {
    return this.consultationDictationsService.findAll(consultationId, query);
  }
}
