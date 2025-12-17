import { ApiProperty } from '@nestjs/swagger';
import { Species } from '../entities/species.entity';

class PaginationMeta {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;
}

export class PaginatedSpeciesResponseDto {
  @ApiProperty({ type: () => [Species] })
  data: Species[];

  @ApiProperty({ type: () => PaginationMeta })
  meta: PaginationMeta;
}
