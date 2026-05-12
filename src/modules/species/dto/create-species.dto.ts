import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSpeciesDto {
  @ApiProperty({ example: 'Cachorro', description: 'Nome da espécie' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: true, required: false, description: 'Status da espécie' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
