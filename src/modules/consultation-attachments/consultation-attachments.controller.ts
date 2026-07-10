import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConsultationAttachment } from './entities/consultation-attachment.entity';
import { ConsultationAttachmentsService } from './consultation-attachments.service';
import { CreateConsultationAttachmentDto } from './dto/create-consultation-attachment.dto';

@ApiTags('Consultation Attachments')
@ApiBearerAuth()
@Controller({
  path: 'consultations',
  version: '1',
})
export class ConsultationAttachmentsController {
  constructor(
    private readonly consultationAttachmentsService: ConsultationAttachmentsService,
  ) {}

  @Post(':consultationId/attachments')
  @ApiOperation({ summary: 'Faz upload de arquivo para o prontuário da consulta' })
  @ApiParam({ name: 'consultationId', type: Number })
  @ApiCreatedResponse({ type: ConsultationAttachment })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        attachmentType: { type: 'string', example: 'DOCUMENT' },
        notes: { type: 'string', example: 'Arquivo enviado pelo tutor' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  create(
    @Param('consultationId', ParseIntPipe) consultationId: number,
    @Body() payload: CreateConsultationAttachmentDto,
    @Req() req: any,
    @UploadedFile()
    file?: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    const requestBaseUrl = `${req?.protocol || 'http'}://${req?.get?.('host') || 'localhost:3000'}`;
    return this.consultationAttachmentsService.create(
      consultationId,
      payload,
      file,
      req.user?.userId,
      requestBaseUrl,
    );
  }

  @Get(':consultationId/attachments')
  @ApiOperation({ summary: 'Lista arquivos anexados ao prontuário da consulta' })
  @ApiParam({ name: 'consultationId', type: Number })
  @ApiOkResponse({ type: ConsultationAttachment, isArray: true })
  findAll(@Param('consultationId', ParseIntPipe) consultationId: number) {
    return this.consultationAttachmentsService.findAll(consultationId);
  }

  @Delete('attachments/:id')
  @ApiOperation({ summary: 'Remove anexo do prontuário' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse()
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.consultationAttachmentsService.remove(id);
  }
}
