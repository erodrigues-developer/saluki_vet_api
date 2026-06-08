import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  constructor(
    private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {}

  async readBinaryFile(file: string, bucket: string) {
    const params = {
      Bucket: bucket,
      Key: file,
    };

    const command = new GetObjectCommand(params);
    const { Body } = await this.s3Client.send(command);

    if (Body instanceof Readable) {
      const chunks = [];
      for await (const chunk of Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } else {
      throw new Error('Expected a stream but did not receive one.');
    }
  }

  async uploadBinaryFile(params: {
    buffer: Buffer;
    key: string;
    contentType?: string;
    bucket?: string;
    cacheControl?: string;
  }) {
    const bucket =
      params.bucket || this.configService.get<string>('aws.s3.bucket');

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: params.key,
        Body: params.buffer,
        ContentType: params.contentType || 'application/octet-stream',
        CacheControl: params.cacheControl,
      }),
    );

    return {
      bucket,
      key: params.key,
      url: this.resolvePublicUrl(bucket, params.key),
    };
  }

  private resolvePublicUrl(bucket: string, key: string) {
    const configuredBaseUrl = this.configService.get<string>(
      'aws.s3.publicBaseUrl',
    );
    if (configuredBaseUrl?.trim()) {
      return `${configuredBaseUrl.replace(/\/+$/, '')}/${key}`;
    }

    const region =
      this.configService.get<string>('aws.s3.region') || 'us-east-1';
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
