import { PartialType } from '@nestjs/swagger';
import { CreateExamCategoryDto } from './create-exam-category.dto';

export class UpdateExamCategoryDto extends PartialType(CreateExamCategoryDto) {}
