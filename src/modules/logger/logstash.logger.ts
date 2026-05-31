import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UDPTransport } from 'udp-transport-winston';
import * as winston from 'winston';

@Injectable()
export class LogstashLogger implements LoggerService {
  private static readonly MAX_UDP_LOG_BYTES = 8 * 1024;
  private logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const udpTransport = new UDPTransport({
      host: this.configService.get<string>('logs.logstashUrl'),
      port: this.configService.get<number>('logs.logstashPort'),
    });

    const originalClose = udpTransport.close.bind(udpTransport);
    udpTransport.close = () => {
      try {
        originalClose();
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code !== 'ERR_SOCKET_DGRAM_NOT_CONNECTED') {
          throw error;
        }
      }
    };

    this.logger = winston.createLogger({
      format: winston.format.json(),
      transports: [udpTransport],
    });

    udpTransport.on('error', (error: Error) => {
      if ((error as NodeJS.ErrnoException).code === 'EMSGSIZE') {
        return;
      }
      // Keep process alive for transport-level errors.
      console.error('Logstash UDP transport error:', error);
    });

    this.logger.on('error', (error: Error) => {
      if ((error as NodeJS.ErrnoException).code === 'EMSGSIZE') {
        return;
      }
      console.error('Winston logger error:', error);
    });
  }

  log(message: string, ...optionalParams: any[]) {
    this.write('info', message, optionalParams);
  }

  fatal(message: string, ...optionalParams: any[]) {
    this.write('error', message, optionalParams);
  }

  error(message: string, ...optionalParams: any[]) {
    this.write('error', message, optionalParams);
  }

  warn(message: string, ...optionalParams: any[]) {
    this.write('warn', message, optionalParams);
  }

  debug?(message: string, ...optionalParams: any[]) {
    this.write('debug', message, optionalParams);
  }

  verbose?(message: string, ...optionalParams: any[]) {
    this.write('verbose', message, optionalParams);
  }

  private write(level: string, message: string, optionalParams: any[]) {
    const entry = {
      level,
      message: String(message),
      meta: this.normalizeOptionalParams(optionalParams),
    };

    const serialized = JSON.stringify(entry);
    if (Buffer.byteLength(serialized, 'utf8') <= LogstashLogger.MAX_UDP_LOG_BYTES) {
      this.logger.log(entry);
      return;
    }

    const overhead = Buffer.byteLength(
      JSON.stringify({ ...entry, message: '', meta: { truncated: true } }),
      'utf8',
    );
    const maxMessageBytes = Math.max(0, LogstashLogger.MAX_UDP_LOG_BYTES - overhead);
    const truncatedMessage = Buffer.from(entry.message, 'utf8')
      .subarray(0, maxMessageBytes)
      .toString('utf8');

    this.logger.log({
      level,
      message: truncatedMessage,
      meta: { truncated: true },
    });
  }

  private normalizeOptionalParams(optionalParams: any[]) {
    if (!optionalParams?.length) {
      return undefined;
    }

    return optionalParams.map((param) => {
      if (param instanceof Error) {
        return {
          name: param.name,
          message: param.message,
          stack: param.stack,
        };
      }

      if (typeof param === 'string') {
        return param;
      }

      try {
        return JSON.parse(
          JSON.stringify(param, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)),
        );
      } catch {
        return '[unserializable-meta]';
      }
    });
  }
}
