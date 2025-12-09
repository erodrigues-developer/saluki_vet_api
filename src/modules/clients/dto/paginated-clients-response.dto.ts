import { ApiProperty } from '@nestjs/swagger';
import { Client } from '../entities/client.entity';

class PaginationMeta {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;
}

export class PaginatedClientsResponseDto {
  @ApiProperty({ type: () => [Client] })
  data: Client[];

  @ApiProperty({ type: () => PaginationMeta })
  meta: PaginationMeta;
}
