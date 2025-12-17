import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateBreedDto {
  @ApiProperty({ example: 'Bulldog', description: 'Nome da raça' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 1, description: 'ID da espécie associada' })
  @IsInt()
  @Min(1)
  speciesId: number;
}
