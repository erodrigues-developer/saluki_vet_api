import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { protectedFileUrl } from './file-access';
@Injectable()
export class PrivateFilesInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    const rewrite = (value: any): any => {
      if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) return value;
      if (Array.isArray(value)) return value.map(rewrite);
      const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key,rewrite(item)]));
      if (typeof result.storageKey === 'string' && /^(reports|exam-results|consultations\/attachments|fiscal\/documents)\//.test(result.storageKey)) result.fileUrl = protectedFileUrl(result.storageKey);
      if (typeof result.photoStorageKey === 'string') result.photoUrl = protectedFileUrl(result.photoStorageKey);
      return result;
    };
    return next.handle().pipe(map(rewrite));
  }
}
