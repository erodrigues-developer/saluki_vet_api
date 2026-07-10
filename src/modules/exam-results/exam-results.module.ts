import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamResult } from './entities/exam-result.entity';
import { ExamResultsController } from './exam-results.controller';
import { ExamResultsService } from './exam-results.service';
import { ExamRequest } from '../exam-requests/entities/exam-request.entity';
import { FileStorageModule } from '../file-storage/file-storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamResult, ExamRequest]),
    FileStorageModule,
  ],
  controllers: [ExamResultsController],
  providers: [ExamResultsService],
  exports: [ExamResultsService],
})
export class ExamResultsModule {}
