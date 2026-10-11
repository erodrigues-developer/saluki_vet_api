import { safeRequestLog } from '../../../security/safe-log';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ModuleRef } from '@nestjs/core';
import { LogstashLogger } from '../../logger/logstash.logger';

@Injectable()
export class SuccessLoggingInterceptor implements NestInterceptor {
  private logstashLogger: LogstashLogger;

  constructor(private readonly moduleRef: ModuleRef) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.logstashLogger) {
      this.logstashLogger = this.moduleRef.get(LogstashLogger, {
        strict: false,
      });
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();
    const now = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const log = {
          action: 'success',
          request: safeRequestLog(request),
          exception: {
            message: '',
            status: response.statusCode,
            stack: '',
          },
          response: {
            statusCode: response.statusCode,
            time: Date.now() - now,
          },
        };
        this.logstashLogger.log('index-name', log);
      }),
    );
  }
}
