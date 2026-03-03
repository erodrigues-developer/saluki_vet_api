import { ApiProperty } from '@nestjs/swagger';
import { Supplier } from '../entities/supplier.entity';

class PaginationMeta {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;
}

export class PaginatedSuppliersResponseDto {
  @ApiProperty({ type: () => [Supplier] })
  data: Supplier[];

  @ApiProperty({ type: () => PaginationMeta })
  meta: PaginationMeta;
}
