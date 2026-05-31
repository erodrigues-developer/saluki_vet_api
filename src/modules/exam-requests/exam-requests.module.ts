import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamRequestsController } from './exam-requests.controller';
import { ExamRequestsService } from './exam-requests.service';
import { ExamRequest } from './entities/exam-request.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { ExamType } from '../exam-types/entities/exam-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamRequest, Pet, Consultation, ExamType]),
  ],
  controllers: [ExamRequestsController],
  providers: [ExamRequestsService],
  exports: [ExamRequestsService],
})
export class ExamRequestsModule {}
