import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ExamResult } from './entities/exam-result.entity';
import { ExamResultsService } from './exam-results.service';
import { CreateExamResultDto } from './dto/create-exam-result.dto';
import { FilterExamResultsDto } from './dto/filter-exam-results.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Exam Results')
@ApiBearerAuth()
@Controller({
  path: 'exam-results',
  version: '1',
})
export class ExamResultsController {
  constructor(private readonly examResultsService: ExamResultsService) {}

  @Post()
  @Permissions('atendimentos.exam_results.create', 'atendimentos.exam_results.upload')
  @ApiOperation({ summary: 'Anexa resultado de exame ao atendimento' })
  @ApiCreatedResponse({ type: ExamResult })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        examRequestId: { type: 'string', example: '12' },
        resultData: { type: 'string', example: '{"plaquetas":"240000"}' },
        notes: { type: 'string', example: 'Arquivo enviado pelo laboratório' },
        completedAt: { type: 'string', example: '2026-07-09T15:00:00Z' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['examRequestId'],
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
    @Body() payload: CreateExamResultDto,
    @Req() req: any,
    @UploadedFile()
    file?: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
  ) {
    if (file && !file.buffer?.length) {
      throw new BadRequestException('Arquivo recebido sem conteúdo.');
    }

    const requestBaseUrl = `${req?.protocol || 'http'}://${req?.get?.('host') || 'localhost:3000'}`;
    return this.examResultsService.create(
      payload,
      file,
      req.user?.userId,
      requestBaseUrl,
    );
  }

  @Get()
  @Permissions(
    'atendimentos.exam_results.view',
    'atendimentos.consultations.view',
  )
  @ApiOperation({ summary: 'Lista resultados de exames por consulta ou pedido' })
  @ApiOkResponse({ type: ExamResult, isArray: true })
  findAll(@Query() query: FilterExamResultsDto) {
    return this.examResultsService.findAll(query);
  }
}
