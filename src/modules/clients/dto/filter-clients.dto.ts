import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class FilterClientsDto {
  @ApiPropertyOptional({
    description: 'Filtra por nome (busca parcial)',
    example: 'Maria',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtra por documento (busca parcial)',
    example: '12345678900',
  })
  @IsString()
  @IsOptional()
  document?: string;

  @ApiPropertyOptional({
    description: 'Filtra por email (busca parcial)',
    example: 'cliente@email.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filtra por status ativo',
    example: true,
  })
  @IsBooleanString()
  @IsOptional()
  isActive?: string;

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
}
