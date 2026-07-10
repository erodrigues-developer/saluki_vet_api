import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateExamResultDto {
  @ApiProperty({ example: '12', required: true })
  @IsString()
  examRequestId: string;

  @ApiProperty({ example: '{"hemacias": "5.8"}', required: false })
  @IsOptional()
  @IsString()
  resultData?: string;

  @ApiProperty({ example: 'Arquivo anexado pelo laboratório', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: '2026-07-09T15:00:00Z', required: false })
  @IsOptional()
  @IsString()
  completedAt?: string;
}
