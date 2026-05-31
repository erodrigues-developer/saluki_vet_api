import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamType } from './entities/exam-type.entity';
import { ExamTypesController } from './exam-types.controller';
import { ExamTypesService } from './exam-types.service';
import { ExamTypesRepository } from './repositories/exam-types.repository';
import { ExamCategory } from '../exam-categories/entities/exam-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamType, ExamCategory])],
  controllers: [ExamTypesController],
  providers: [ExamTypesService, ExamTypesRepository],
  exports: [ExamTypesService],
})
export class ExamTypesModule {}
