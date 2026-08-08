import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { S3Service } from '../s3/services/s3.service';
import { normalizeFileNameEncoding } from '../../common/utils/file-name-encoding.util';

@Injectable()
export class FileStorageService {
  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {}

  async uploadBinaryFile(
    file: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
    options: {
      folder: string;
      requestBaseUrl: string;
      allowedMimePrefixes?: string[];
      allowedMimeTypes?: string[];
      maxFileSizeBytes: number;
      cacheControl?: string;
    },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo recebido sem conteúdo.');
    }

    const mimeType = String(file.mimetype || '').toLowerCase();
    const allowedPrefixes = options.allowedMimePrefixes || [];
    const allowedTypes = options.allowedMimeTypes || [];
    const isAllowedByPrefix = allowedPrefixes.some((prefix) =>
      mimeType.startsWith(prefix.toLowerCase()),
    );
    const isAllowedByType = allowedTypes.some(
      (allowedType) => allowedType.toLowerCase() === mimeType,
    );

    if (
      (allowedPrefixes.length || allowedTypes.length) &&
      !isAllowedByPrefix &&
      !isAllowedByType
    ) {
      throw new BadRequestException('Tipo de arquivo não permitido.');
    }

    if (Number(file.size || 0) > options.maxFileSizeBytes) {
      throw new BadRequestException('Arquivo excede o tamanho permitido.');
    }

    const originalName = normalizeFileNameEncoding(file.originalname);
    const extension = this.resolveFileExtension(originalName, mimeType);
    const fileName = `${randomUUID()}${extension}`;
    const normalizedFolder = options.folder.replace(/^\/+|\/+$/g, '');
    const storageKey = `${normalizedFolder}/${fileName}`;

    if (this.isProductionUpload()) {
      const uploaded = await this.s3Service.uploadBinaryFile({
        buffer: file.buffer,
        key: storageKey,
        contentType: file.mimetype,
        cacheControl:
          options.cacheControl || 'public, max-age=31536000, immutable',
      });

      return {
        fileUrl: uploaded.url,
        storageKey,
        originalName: originalName || fileName,
        mimeType: file.mimetype || 'application/octet-stream',
        fileSize: Number(file.size || file.buffer.length),
      };
    }

    const uploadsDir = join(process.cwd(), 'uploads', normalizedFolder);
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, fileName), file.buffer);

    return {
      fileUrl: `${options.requestBaseUrl.replace(/\/+$/, '')}/uploads/${normalizedFolder}/${fileName}`,
      storageKey,
      originalName: originalName || fileName,
      mimeType: file.mimetype || 'application/octet-stream',
      fileSize: Number(file.size || file.buffer.length),
    };
  }

  async readBinaryFile(storageKey: string, bucket?: string) {
    const normalizedKey = String(storageKey || '').replace(/^\/+/, '');
    if (!normalizedKey) {
      throw new BadRequestException('Chave de storage não informada.');
    }

    if (this.isProductionUpload()) {
      const targetBucket =
        bucket || this.configService.get<string>('aws.s3.bucket');
      if (!targetBucket) {
        throw new BadRequestException('Bucket S3 não configurado.');
      }
      return this.s3Service.readBinaryFile(normalizedKey, targetBucket);
    }

    return readFile(join(process.cwd(), 'uploads', normalizedKey));
  }

  private isProductionUpload() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private resolveFileExtension(originalName?: string, mimeType?: string) {
    const originalExtension = extname(String(originalName || '')).toLowerCase();
    if (originalExtension) {
      return originalExtension;
    }

    const mimeToExtension: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        '.xlsx',
    };

    return mimeToExtension[String(mimeType || '').toLowerCase()] || '.bin';
  }
}
