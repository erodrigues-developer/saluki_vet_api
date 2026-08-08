import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionsRepository extends Repository<Permission> {
  constructor(private readonly dataSource: DataSource) {
    super(Permission, dataSource.createEntityManager());
  }
}
