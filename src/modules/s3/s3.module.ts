import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Service } from './services/s3.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: S3Client,
      useFactory: (configService: ConfigService) => {
        const accessKeyEnabled = configService.get<boolean>(
          'aws.accessKeyEnabled',
        );

        return new S3Client({
          region: configService.get<string>('aws.s3.region'),
          ...(accessKeyEnabled && {
            credentials: {
              accessKeyId: configService.get<string>('aws.s3.accessKey'),
              secretAccessKey: configService.get<string>(
                'aws.s3.secretAccessKey',
              ),
            },
          }),
        });
      },
      inject: [ConfigService],
    },
    S3Service,
  ],
  exports: [S3Service],
})
export class S3Module {}
