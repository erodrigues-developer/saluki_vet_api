import { ApiProperty } from '@nestjs/swagger';
import { AuthDataDto } from './auth-data.dto';

export class LoginResponseDto {
  @ApiProperty({ type: AuthDataDto })
  data: AuthDataDto;
}
