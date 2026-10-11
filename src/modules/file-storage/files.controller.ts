import { Controller, Get, Query, Req, Res, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { DataSource } from 'typeorm';
import { Authenticated } from '../../common/decorators/authenticated.decorator';
import { FileStorageService } from './file-storage.service';
import { assertReportAccess, hasPermission } from '../../security/file-access';
@Controller({path: 'files', version: '1'})
@Authenticated()
export class FilesController {
  constructor(private readonly files: FileStorageService, private readonly db: DataSource) {}
  @Get('download')
  async download(@Query('key') key: string, @Req() req: any, @Res() res: Response) {
    if (!/^(reports|exam-results|consultations\/attachments|pets\/photos|fiscal\/documents\/\d+)\/[a-f0-9-]+\.[a-z0-9]+$/.test(key || '')) throw new NotFoundException();
    let record: any;
    if (key.startsWith('reports/')) {
      [record] = await this.db.query('SELECT report_type, requested_by_user_id, mime_type FROM report_generations WHERE storage_key = $1', [key]);
      if (!record) throw new NotFoundException();
      if (!hasPermission(req.user,'relatorios.reports.download')) throw new ForbiddenException();
      assertReportAccess(req.user, record.report_type, record.requested_by_user_id);
    } else {
      const config = key.startsWith('exam-results/') ? {table: 'exam_results', permission: 'atendimentos.exam_results.view', deleted: ''}
        : key.startsWith('consultations/attachments/') ? {table: 'consultation_attachments', permission: 'atendimentos.consultation_attachments.view', deleted: ' AND deleted_at IS NULL'}
        : key.startsWith('fiscal/') ? {table: 'fiscal_document_files', permission: 'fiscal.documents.view', deleted: ''} : null;
      if (config) {
        if (!hasPermission(req.user,config.permission) && !(config.table !== 'fiscal_document_files' && hasPermission(req.user,'atendimentos.consultations.view'))) throw new ForbiddenException();
        [record] = await this.db.query(config.table === 'fiscal_document_files' ? "SELECT 'application/octet-stream' AS mime_type FROM fiscal_document_files WHERE storage_path = $1" : `SELECT mime_type FROM ${config.table} WHERE storage_key = $1${config.deleted}`, [key]);
        if (!record) throw new NotFoundException();
      } else {
        if (!hasPermission(req.user,'pets.pets.view')) throw new ForbiddenException();
        const [pet] = await this.db.query('SELECT id FROM pets WHERE photo_storage_key = $1 AND deleted_at IS NULL', [key]);
        if (!pet) throw new NotFoundException();
      }
    }
    const buffer = await this.files.readBinaryFile(key);
    const photoMime = ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'} as Record<string,string>)[key.split('.').pop()!];
    res.setHeader('Content-Type', record?.mime_type || photoMime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`);
    if (key.startsWith('pets/photos/')) res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  }
}
