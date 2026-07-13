import { PartialType } from '@nestjs/swagger';
import { CreateAccountPayableDto } from './create-account-payable.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class UpdateAccountPayableDto extends PartialType(
  CreateAccountPayableDto,
) {}

export class UpdateAccountPayableWithScopeDto extends UpdateAccountPayableDto {
  @ApiPropertyOptional({ example: 'THIS_AND_NEXT' })
  @IsOptional()
  @IsIn(['THIS', 'THIS_AND_NEXT'])
  scope?: 'THIS' | 'THIS_AND_NEXT';
}
