import { Module } from '@nestjs/common';
import { S3Module } from '../s3/s3.module';
import { FileStorageService } from './file-storage.service';

@Module({
  imports: [S3Module],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
