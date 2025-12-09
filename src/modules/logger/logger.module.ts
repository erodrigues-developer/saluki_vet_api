import { Module } from '@nestjs/common';
import { LogstashLogger } from './logstash.logger';

@Module({
  providers: [LogstashLogger],
  exports: [LogstashLogger],
})
export class LoggerModule {}
