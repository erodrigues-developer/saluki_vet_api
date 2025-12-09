import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UDPTransport } from 'udp-transport-winston';
import * as winston from 'winston';

@Injectable()
export class LogstashLogger implements LoggerService {
  private logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    this.logger = winston.createLogger({
      format: winston.format.json(),
      transports: [
        new UDPTransport({
          host: this.configService.get<string>('logs.logstashUrl'),
          port: this.configService.get<number>('logs.logstashPort'),
        }),
      ],
    });
  }

  log(message: string, ...optionalParams: any[]) {
    this.logger.info(message, optionalParams);
  }

  fatal(message: string, ...optionalParams: any[]) {
    this.logger.error(message, optionalParams);
  }

  error(message: string, ...optionalParams: any[]) {
    this.logger.error(message, optionalParams);
  }

  warn(message: string, ...optionalParams: any[]) {
    this.logger.warn(message, optionalParams);
  }

  debug?(message: string, ...optionalParams: any[]) {
    this.logger.debug(message, optionalParams);
  }

  verbose?(message: string, ...optionalParams: any[]) {
    this.logger.verbose(message, optionalParams);
  }
}
