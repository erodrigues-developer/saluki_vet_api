import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class FilterSuppliersDto {
  @ApiPropertyOptional({
    description: 'Busca parcial por nome, razao social ou documento',
    example: 'zoe',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtra por status ativo',
    example: true,
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === true || value === 'true') {
      return true;
    }
    if (value === false || value === 'false') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Pagina (comeca em 1)',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por pagina',
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1500)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Campo de ordenacao',
    enum: ['name', 'createdAt', 'updatedAt'],
    example: 'name',
    default: 'name',
  })
  @IsString()
  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy?: string = 'name';

  @ApiPropertyOptional({
    description: 'Direcao da ordenacao',
    enum: ['asc', 'desc'],
    example: 'asc',
    default: 'asc',
  })
  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: string = 'asc';
}
