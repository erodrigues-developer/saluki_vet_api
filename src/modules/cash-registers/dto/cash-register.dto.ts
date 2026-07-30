import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

const toMoneyNumber = ({ value }: { value: unknown }) =>
  value === null || value === undefined || value === ''
    ? value
    : Number(Number(value).toFixed(2));

export class CreateThermalPrinterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsIn(['BROWSER_PRINT', 'NETWORK_ESC_POS', 'LOCAL_AGENT', 'PDF_DOWNLOAD'])
  connectionType: string;

  @IsString()
  @IsNotEmpty()
  target: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  paperWidthMm?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  columns?: number;

  @IsBoolean()
  @IsOptional()
  supportsQrCode?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateThermalPrinterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsIn(['BROWSER_PRINT', 'NETWORK_ESC_POS', 'LOCAL_AGENT', 'PDF_DOWNLOAD'])
  @IsOptional()
  connectionType?: string;

  @IsString()
  @IsOptional()
  target?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  paperWidthMm?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  columns?: number;

  @IsBoolean()
  @IsOptional()
  supportsQrCode?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateTerminalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  defaultPrinterId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTerminalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  defaultPrinterId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class OpenCashRegisterSessionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  terminalId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  openingAmount: number;

  @IsDateString()
  @IsOptional()
  openedAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class WithdrawCashDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  notes: string;

  @IsDateString()
  @IsOptional()
  occurredAt?: string;
}

export class CloseCashRegisterSessionDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  declaredCashAmount: number;

  @IsDateString()
  @IsOptional()
  closedAt?: string;

  @IsString()
  @IsOptional()
  closingNotes?: string;
}

export class PrintReceiptPaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentMethodId: number;

  @Type(() => Number)
  @Transform(toMoneyNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @Type(() => Number)
  @Transform(toMoneyNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  tenderedAmount?: number;

  @Type(() => Number)
  @Transform(toMoneyNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  changeAmount?: number;
}

export class PrintRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  printerId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  copies?: number;

  @ValidateNested({ each: true })
  @Type(() => PrintReceiptPaymentDto)
  @IsOptional()
  receiptPayments?: PrintReceiptPaymentDto[];
}
