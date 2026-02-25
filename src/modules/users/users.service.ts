import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rolesService: RolesService,
  ) {}

  async create(payload: CreateUserDto): Promise<User> {
    const roles = await this.rolesService.findByIds(payload.roleIds);

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(payload.password, salt);

    const user = this.usersRepository.create({
      ...payload,
      passwordHash,
      roles,
    });

    const saved = await this.usersRepository.save(user);
    return this.findOne(saved.id);
  }

  async findAll(filters: FilterUsersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const { data, total } = await this.usersRepository.findPaginated({
        ...filters,
        page,
        limit,
        sortBy: filters.sortBy === 'createdAt' ? 'created_at' : filters.sortBy === 'updatedAt' ? 'updated_at' : filters.sortBy,
        sortDirection: filters.sortDirection?.toUpperCase() as any || 'DESC',
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async update(id: number, payload: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (payload.roleIds) {
      user.roles = await this.rolesService.findByIds(payload.roleIds);
    }

    if (payload.password) {
      const salt = await bcrypt.genSalt();
      user.passwordHash = await bcrypt.hash(payload.password, salt);
    }

    const { roleIds, password, ...rest } = payload;
    const merged = this.usersRepository.merge(user, rest);
    const saved = await this.usersRepository.save(merged);

    return this.findOne(saved.id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.usersRepository.softDelete(id);
  }
}
