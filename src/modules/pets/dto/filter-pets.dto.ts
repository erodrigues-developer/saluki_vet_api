import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class FilterPetsDto {
  @ApiPropertyOptional({
    description: 'Filtra por nome (busca parcial)',
    example: 'Thor',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtra por clientId',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por microchipCode (busca parcial)',
    example: 'MC-123',
  })
  @IsString()
  @IsOptional()
  microchipCode?: string;

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
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo de ordenação',
    example: 'createdAt',
    enum: ['name', 'clientId', 'microchipCode', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  @IsIn(['name', 'clientId', 'microchipCode', 'createdAt', 'updatedAt'])
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
