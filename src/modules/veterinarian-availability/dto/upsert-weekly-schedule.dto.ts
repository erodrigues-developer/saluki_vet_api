import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class WeeklyPeriodDto {
  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime: string;
}

export class WeeklyScheduleDayDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable: boolean;

  @ApiProperty({ type: [WeeklyPeriodDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyPeriodDto)
  periods?: WeeklyPeriodDto[];
}

export class UpsertWeeklyScheduleDto {
  @ApiProperty({ type: [WeeklyScheduleDayDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyScheduleDayDto)
  days: WeeklyScheduleDayDto[];
}
