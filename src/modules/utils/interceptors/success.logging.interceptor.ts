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
import { LogstashLogger } from 'src/modules/logger/logstash.logger';

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
        let responseBody = '';
        try {
          responseBody = JSON.stringify(data);
        } catch (error) {}

        const log = {
          action: 'success',
          request: {
            method: request.method,
            url: request.originalUrl || request.url,
            body: JSON.stringify(request.body),
            query: JSON.stringify(request.query),
            headers: JSON.stringify(request.headers),
          },
          exception: {
            message: '',
            status: response.statusCode,
            stack: '',
          },
          response: {
            body: responseBody,
            statusCode: response.statusCode,
            time: Date.now() - now,
          },
        };
        this.logstashLogger.log('index-name', log);
      }),
    );
  }
}
