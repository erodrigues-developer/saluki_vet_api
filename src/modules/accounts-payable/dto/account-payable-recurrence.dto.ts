import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AccountPayableRecurrenceDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ example: 'MONTHLY' })
  @IsOptional()
  @IsIn(['WEEKLY', 'MONTHLY', 'YEARLY'])
  frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  intervalCount: number;

  @ApiPropertyOptional({ example: '2027-07-10' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  occurrencesLimit?: number;
}
