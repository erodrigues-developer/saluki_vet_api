import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateRolePermissionsDto {
  @ApiProperty({
    example: ['dashboard.view', 'cadastros.users.view'],
    description: 'Códigos das permissões atribuídas ao papel',
  })
  @IsArray()
  @IsString({ each: true })
  permissionCodes: string[];
}
