import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

class Meta {
  @ApiProperty({ example: 100 })
  total: number;
  @ApiProperty({ example: 1 })
  page: number;
  @ApiProperty({ example: 10 })
  limit: number;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [User] })
  data: User[];
  @ApiProperty()
  meta: Meta;
}
