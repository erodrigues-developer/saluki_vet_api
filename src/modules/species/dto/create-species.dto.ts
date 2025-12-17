import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSpeciesDto {
  @ApiProperty({ example: 'Cachorro', description: 'Nome da espécie' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
