import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateExamCategoryDto {
  @ApiProperty({ example: 'Laboratorial', description: 'Nome da categoria de exame' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Status da categoria',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
