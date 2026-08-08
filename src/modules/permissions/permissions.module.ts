import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsRepository } from './repositories/permissions.repository';
import { RolePermissionsRepository } from './repositories/role-permissions.repository';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, RolePermission, Role])],
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    PermissionsRepository,
    RolePermissionsRepository,
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
