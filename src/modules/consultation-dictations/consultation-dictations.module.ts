import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from '../consultations/entities/consultation.entity';
import { ConsultationDictationAiService } from './consultation-dictation-ai.service';
import { ConsultationDictationsController } from './consultation-dictations.controller';
import { ConsultationDictationsService } from './consultation-dictations.service';
import { ConsultationDictation } from './entities/consultation-dictation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConsultationDictation, Consultation])],
  controllers: [ConsultationDictationsController],
  providers: [ConsultationDictationAiService, ConsultationDictationsService],
  exports: [ConsultationDictationAiService, ConsultationDictationsService],
})
export class ConsultationDictationsModule {}
