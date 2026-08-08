import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RolePermission } from '../entities/role-permission.entity';

@Injectable()
export class RolePermissionsRepository extends Repository<RolePermission> {
  constructor(private readonly dataSource: DataSource) {
    super(RolePermission, dataSource.createEntityManager());
  }
}
