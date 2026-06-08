import { ApiProperty } from '@nestjs/swagger';
import { Box } from '../entities/box.entity';

class PaginatedBoxesMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 24 })
  total: number;
}

export class PaginatedBoxesResponseDto {
  @ApiProperty({ type: Box, isArray: true })
  data: Box[];

  @ApiProperty({ type: PaginatedBoxesMetaDto })
  meta: PaginatedBoxesMetaDto;
}
