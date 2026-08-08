import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { PermissionsRepository } from './repositories/permissions.repository';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionsRepository.find({
      order: { module: 'ASC', resource: 'ASC', action: 'ASC' },
    });
  }

  async findRolePermissions(roleId: number): Promise<Permission[]> {
    const role = await this.dataSource.getRepository(Role).findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    return [...(role.permissions || [])].sort((a, b) =>
      a.code.localeCompare(b.code),
    );
  }

  async updateRolePermissions(
    roleId: number,
    permissionCodes: string[],
  ): Promise<Permission[]> {
    const roleRepository = this.dataSource.getRepository(Role);
    const role = await roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    const uniqueCodes = [...new Set(permissionCodes)];
    const permissions = uniqueCodes.length
      ? await this.permissionsRepository.find({
          where: { code: In(uniqueCodes) },
        })
      : [];

    if (permissions.length !== uniqueCodes.length) {
      throw new BadRequestException('Algumas permissões não existem.');
    }

    if (
      role.code === 'ADMIN' &&
      !permissions.some((item) => item.code === 'cadastros.permissions.manage')
    ) {
      throw new BadRequestException(
        'Administrador deve manter permissão para gerenciar segurança.',
      );
    }

    role.permissions = permissions;
    await roleRepository.save(role);
    return this.findRolePermissions(roleId);
  }

  getEffectivePermissionCodes(user: { roles?: Role[] | null }): string[] {
    const codes = new Set<string>();
    for (const role of user.roles || []) {
      for (const permission of role.permissions || []) {
        codes.add(permission.code);
      }
    }
    return [...codes].sort();
  }
}
