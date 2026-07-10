import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationAttachmentsController } from './consultation-attachments.controller';
import { ConsultationAttachmentsService } from './consultation-attachments.service';
import { ConsultationAttachment } from './entities/consultation-attachment.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { FileStorageModule } from '../file-storage/file-storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsultationAttachment, Consultation]),
    FileStorageModule,
  ],
  controllers: [ConsultationAttachmentsController],
  providers: [ConsultationAttachmentsService],
  exports: [ConsultationAttachmentsService],
})
export class ConsultationAttachmentsModule {}
