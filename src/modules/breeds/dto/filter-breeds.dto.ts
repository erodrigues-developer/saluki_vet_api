import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class FilterBreedsDto {
  @ApiPropertyOptional({
    description: 'Filtra por nome (busca parcial)',
    example: 'Bull',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtra por speciesId',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  speciesId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por status ativo/inativo',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Página (começa em 1)',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página (máx 100)',
    example: 10,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1500)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo de ordenação',
    example: 'createdAt',
    enum: ['name', 'speciesId', 'isActive', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  @IsIn(['name', 'speciesId', 'isActive', 'createdAt', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: string = 'desc';
}
