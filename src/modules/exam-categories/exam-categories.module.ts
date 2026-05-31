import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamCategory } from './entities/exam-category.entity';
import { ExamCategoriesController } from './exam-categories.controller';
import { ExamCategoriesService } from './exam-categories.service';
import { ExamCategoriesRepository } from './repositories/exam-categories.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ExamCategory])],
  controllers: [ExamCategoriesController],
  providers: [ExamCategoriesService, ExamCategoriesRepository],
  exports: [ExamCategoriesService],
})
export class ExamCategoriesModule {}
