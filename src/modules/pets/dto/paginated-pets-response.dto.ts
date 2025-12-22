import { ApiProperty } from '@nestjs/swagger';
import { Pet } from '../entities/pet.entity';

class PaginationMeta {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;
}

export class PaginatedPetsResponseDto {
  @ApiProperty({ type: () => [Pet] })
  data: Pet[];

  @ApiProperty({ type: () => PaginationMeta })
  meta: PaginationMeta;
}
