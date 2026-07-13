import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';

export class GenerateReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  veterinarianId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  stockLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  productCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  movementType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expirationStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appointmentStatusCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  appointmentTypeId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsIn(
    [
      'REVENUE_BY_PERIOD',
      'OPEN_ACCOUNTS_RECEIVABLE',
      'ACCOUNTS_PAYABLE_BY_DUE_DATE',
      'APPOINTMENTS_AND_CONSULTATIONS_BY_PERIOD',
      'STOCK_MOVEMENT_AND_POSITION',
    ],
    { each: true },
  )
  reportTypes?: string[];
}
