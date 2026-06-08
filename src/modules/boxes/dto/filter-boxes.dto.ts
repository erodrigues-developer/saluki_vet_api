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

const parseBoolean = ({ value }: { value: unknown }) => {
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
};

export class FilterBoxesDto {
  @ApiPropertyOptional({
    description: 'Filtra por nome ou descrição (busca parcial)',
    example: 'Canil',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: true })
  @Transform(parseBoolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description:
      'Quando true, retorna apenas boxes disponiveis para nova internacao.',
  })
  @Transform(parseBoolean)
  @IsBoolean()
  @IsOptional()
  availableOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra pelo status de ocupação atual',
    example: 'AVAILABLE',
    enum: ['AVAILABLE', 'OCCUPIED'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['AVAILABLE', 'OCCUPIED'])
  occupancyStatus?: 'AVAILABLE' | 'OCCUPIED';

  @ApiPropertyOptional({
    description: 'Página (começa em 1). Quando omitido, retorna a lista completa.',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Itens por página (máx 100)',
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Campo de ordenação',
    example: 'updatedAt',
    enum: ['name', 'isActive', 'createdAt', 'updatedAt'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['name', 'isActive', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'isActive' | 'createdAt' | 'updatedAt';

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc';
}
