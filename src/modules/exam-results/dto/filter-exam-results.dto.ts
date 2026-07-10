import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterExamResultsDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsString()
  examRequestId?: string;
}
