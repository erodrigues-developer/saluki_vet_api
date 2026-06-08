import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBoxDto {
  @ApiProperty({ example: 'Canil P2' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'Internação cães pequeno porte',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
