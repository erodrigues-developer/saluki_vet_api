import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePetDto {
  @ApiProperty({ example: 'Thor', description: 'Nome do pet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 1, description: 'ID do cliente' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clientId: number;

  @ApiProperty({ example: 1, description: 'ID da espécie' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  speciesId: number;

  @ApiProperty({ example: 1, required: false, description: 'ID da raça' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  breedId?: number;

  @ApiProperty({ example: 'M', required: false, description: 'Sexo (M, F, N)' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  sex?: string;

  @ApiProperty({ example: '2020-05-01', required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: 12.5, required: false })
  @Type(() => Number)
  @IsOptional()
  weightKg?: number;

  @ApiProperty({ example: 'Caramelo', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  color?: string;

  @ApiProperty({ example: 'MC-123456', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  microchipCode?: string;

  @ApiProperty({ example: 'Poeira', required: false })
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiProperty({ example: 'Diabetes', required: false })
  @IsString()
  @IsOptional()
  chronicDiseases?: string;

  @ApiProperty({ example: 'Muito dócil', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
