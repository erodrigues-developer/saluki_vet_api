import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  constructor(private readonly s3Client: S3Client) {}

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
}
