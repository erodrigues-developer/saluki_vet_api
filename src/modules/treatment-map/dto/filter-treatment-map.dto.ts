import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class FilterTreatmentMapDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'EXECUTED'] })
  @IsString()
  @IsIn(['PENDING', 'EXECUTED'])
  @IsOptional()
  status?: string;
}
