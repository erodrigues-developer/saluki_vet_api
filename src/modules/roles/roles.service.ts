import { Injectable, NotFoundException } from '@nestjs/common';
import { RolesRepository } from './repositories/roles.repository';
import { Role } from './entities/role.entity';
import { In } from 'typeorm';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find({
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    return role;
  }

  async findByIds(ids: number[]): Promise<Role[]> {
    const roles = await this.rolesRepository.find({
      where: { id: In(ids) },
      relations: ['permissions'],
    });
    if (roles.length !== ids.length) {
      throw new NotFoundException('Some roles were not found');
    }
    return roles;
  }
}
