import { ApiProperty } from '@nestjs/swagger';
import { Breed } from '../entities/breed.entity';

class PaginationMeta {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;
}

export class PaginatedBreedsResponseDto {
  @ApiProperty({ type: () => [Breed] })
  data: Breed[];

  @ApiProperty({ type: () => PaginationMeta })
  meta: PaginationMeta;
}
