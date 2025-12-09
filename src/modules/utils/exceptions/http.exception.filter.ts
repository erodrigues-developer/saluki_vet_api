import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { LogstashLogger } from 'src/modules/logger/logstash.logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private logstashLogger: LogstashLogger;
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  catch(exception: any, host: ArgumentsHost) {
    if (!this.logstashLogger) {
      this.logstashLogger = this.moduleRef.get(LogstashLogger, {
        strict: false,
      });
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = 500;
    let message = 'Internal server error';
    let stack = exception.stack;
    let errors = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse()['message'] || message;
    }

    if (exception instanceof BadRequestException) {
      const exceptionResponse = exception.getResponse();
      errors = exceptionResponse['message'];
    }

    if (exception instanceof Error) {
      message = exception.message;
    }

    if (exception instanceof AxiosError) {
      message = exception?.response?.data
        ? JSON.stringify(exception?.response?.data)
        : message;
    }

    const exceptionDetails = {
      message: message,
      status: status,
      stack: stack,
    };

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      errors: errors,
    };

    const log = {
      action: 'error',
      request: {
        method: request.method,
        url: request.url,
        body: JSON.stringify(request.body),
        query: JSON.stringify(request.query),
        headers: JSON.stringify(request.headers),
      },
      exception: exceptionDetails,
      response: {
        body: JSON.stringify(responseBody),
        statusCode: status,
      },
    };

    this.logstashLogger.error('index-name', log);
    this.logger.error('Exception', log);

    response.status(status).json(responseBody);
  }
}
