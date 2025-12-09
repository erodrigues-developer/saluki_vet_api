import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SqsService } from './services/sqs.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SQSClient,
      useFactory: (configService: ConfigService) => {
        const accessKeyEnabled = configService.get<boolean>(
          'aws.accessKeyEnabled',
        );

        return new SQSClient({
          region: configService.get<string>('aws.sqs.region'),
          ...(accessKeyEnabled && {
            credentials: {
              accessKeyId: configService.get<string>('aws.sqs.accessKey'),
              secretAccessKey: configService.get<string>(
                'aws.sqs.secretAccessKey',
              ),
            },
          }),
        });
      },
      inject: [ConfigService],
    },
    SqsService,
  ],
  exports: [SqsService],
})
export class SqsModule {}
