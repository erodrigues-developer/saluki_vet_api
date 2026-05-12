import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProcedureDto {
  @ApiProperty({ example: 'Consulta Clinica' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Avaliacao veterinaria geral' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 120 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  defaultPrice?: number | null;

  @ApiPropertyOptional({
    example: 15,
    description:
      'Percentual de comissao aplicado sobre o faturamento do procedimento',
    default: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionPercent?: number = 0;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  consumedProductId?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  consumptionQuantity?: number | null;
}
