import { ApiProperty } from '@nestjs/swagger';

class AuthUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ example: 'joao.silva@vet.com' })
  email: string;

  @ApiProperty({ example: ['ADMIN'] })
  roles: any[];

  @ApiProperty({ example: ['dashboard.view', 'cadastros.users.view'] })
  permissions: string[];
}

export class AuthDataDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
