import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FiscalIssueProcessorService } from './fiscal-issue-processor.service';
import { FiscalService } from './fiscal.service';

@ApiTags('Fiscal')
@ApiBearerAuth()
@Controller({
  path: 'fiscal',
  version: '1',
})
export class FiscalController {
  constructor(
    private readonly fiscalService: FiscalService,
    private readonly fiscalIssueProcessorService: FiscalIssueProcessorService,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'Resumo das configurações fiscais' })
  getSettingsSummary() {
    return this.fiscalService.getSettingsSummary();
  }

  @Get('ncm')
  @ApiOperation({ summary: 'Consulta NCM na BrasilAPI para autocomplete' })
  searchNcm(@Query('search') search: string) {
    return this.fiscalService.searchNcm(search);
  }

  @Get('cfops')
  @ApiOperation({ summary: 'Consulta CFOP local para autocomplete' })
  searchCfops(@Query('search') search: string, @Query('direction') direction?: string) {
    return this.fiscalService.searchCfops(search, direction);
  }

  @Get('municipios')
  @ApiOperation({ summary: 'Consulta municípios IBGE para autocomplete' })
  searchMunicipios(@Query('uf') uf: string, @Query('search') search: string) {
    return this.fiscalService.searchMunicipios(uf, search);
  }

  @Get('payment-types')
  @ApiOperation({ summary: 'Lista codigos fiscais de forma de pagamento NFC-e' })
  listPaymentTypes() {
    return this.fiscalService.listPaymentTypes();
  }

  @Get('profiles')
  @ApiOperation({ summary: 'Lista perfis fiscais' })
  listProfiles() {
    return this.fiscalService.listProfiles();
  }

  @Post('profiles')
  @ApiOperation({ summary: 'Cria perfil fiscal' })
  createProfile(@Body() payload: any) {
    return this.fiscalService.upsertProfile(payload);
  }

  @Patch('profiles/:id')
  @ApiOperation({ summary: 'Atualiza perfil fiscal' })
  updateProfile(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.fiscalService.upsertProfile({ ...payload, id });
  }

  @Post('profiles/:id/nfce-configs')
  @ApiOperation({ summary: 'Cria ou atualiza configuração NFC-e do perfil' })
  upsertNfceConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: any,
  ) {
    return this.fiscalService.upsertNfceConfig(id, payload);
  }

  @Post('profiles/:id/certificates')
  @ApiOperation({ summary: 'Faz upload do certificado A1 do perfil fiscal' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        password: { type: 'string' },
        serialNumber: { type: 'string' },
        subjectName: { type: 'string' },
        issuerName: { type: 'string' },
        validFrom: { type: 'string' },
        validTo: { type: 'string' },
      },
      required: ['file', 'password'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadCertificate(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile()
    file?: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
    @Body() payload?: any,
    @Req() req?: any,
  ) {
    if (!file) throw new BadRequestException('Arquivo .pfx não enviado.');
    const requestBaseUrl = this.resolveRequestBaseUrl(req);
    return this.fiscalService.uploadCertificate(
      id,
      file,
      payload || {},
      requestBaseUrl,
    );
  }

  @Patch('profiles/:id/certificates/password')
  @ApiOperation({ summary: 'Atualiza a senha do certificado A1 ativo' })
  updateCertificatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: any,
  ) {
    return this.fiscalService.updateCertificatePassword(id, payload);
  }

  @Get('documents')
  @ApiOperation({ summary: 'Lista documentos fiscais' })
  listDocuments(@Query() query: any) {
    return this.fiscalService.listDocuments(query);
  }

  @Get('documents/files/:fileId/download')
  @ApiOperation({ summary: 'Baixa artefato fiscal XML ou DANFE' })
  async downloadDocumentFile(
    @Param('fileId', ParseIntPipe) fileId: number,
    @Res() res: Response,
  ) {
    const file = await this.fiscalService.downloadDocumentFile(fileId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=0, no-store');
    res.send(file.buffer);
  }

  @Get('issue-requests')
  @ApiOperation({ summary: 'Lista solicitações e pendências fiscais' })
  listIssueRequests(@Query() query: any) {
    return this.fiscalService.listIssueRequests(query);
  }

  @Post('issue-requests/process')
  @ApiOperation({ summary: 'Processa pendências fiscais NFC-e aptas para retry' })
  processIssueRequests(@Body() payload: any) {
    return this.fiscalIssueProcessorService.processPending(
      Number(payload?.limit || 10),
    );
  }

  @Post('issue-requests/:id/process')
  @ApiOperation({ summary: 'Processa uma pendência fiscal NFC-e específica' })
  processIssueRequest(@Param('id', ParseIntPipe) id: number) {
    return this.fiscalIssueProcessorService.processRequest(id);
  }

  private resolveRequestBaseUrl(req: any) {
    const protocol = req?.protocol || 'http';
    const host = req?.get?.('host') || req?.headers?.host || 'localhost:3000';
    return `${protocol}://${host}`;
  }
}
