import { FilesController } from './files.controller';
import { Module } from '@nestjs/common';
import { S3Module } from '../s3/s3.module';
import { FileStorageService } from './file-storage.service';

@Module({
  imports: [S3Module],
  controllers: [FilesController],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
