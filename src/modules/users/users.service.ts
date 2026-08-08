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
    await this.ensureEmailAvailable(payload.email);
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
      sortBy:
        filters.sortBy === 'createdAt'
          ? 'created_at'
          : filters.sortBy === 'updatedAt'
            ? 'updated_at'
            : filters.sortBy,
      sortDirection: (filters.sortDirection?.toUpperCase() as any) || 'DESC',
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
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'name', 'isActive'],
      relations: ['roles', 'roles.permissions'],
    });
  }

  async update(
    id: number,
    payload: UpdateUserDto,
    currentUserId?: number,
  ): Promise<User> {
    const user = await this.findOne(id);
    await this.ensureEmailAvailable(payload.email, id);

    const isSelf = Boolean(currentUserId && Number(currentUserId) === id);
    if (isSelf && payload.isActive === false) {
      throw new BadRequestException(
        'Você não pode inativar o próprio usuário.',
      );
    }

    const wasActiveAdmin = user.isActive && this.hasAdminRole(user);

    if (payload.roleIds !== undefined) {
      const nextRoles = await this.rolesService.findByIds(payload.roleIds);
      if (isSelf && !this.rolesIncludeSecurityManager(nextRoles)) {
        throw new BadRequestException(
          'Você não pode remover sua própria permissão de segurança.',
        );
      }
      user.roles = nextRoles;
    }

    if (payload.password) {
      const salt = await bcrypt.genSalt();
      user.passwordHash = await bcrypt.hash(payload.password, salt);
    }

    const { roleIds, password, ...rest } = payload;
    const merged = this.usersRepository.merge(user, rest);
    const willBeActiveAdmin = merged.isActive && this.hasAdminRole(merged);

    if (wasActiveAdmin && !willBeActiveAdmin) {
      await this.ensureAnotherActiveAdmin(id);
    }

    const saved = await this.usersRepository.save(merged);

    return this.findOne(saved.id);
  }

  async remove(id: number, currentUserId?: number): Promise<void> {
    const user = await this.findOne(id);
    if (currentUserId && Number(currentUserId) === id) {
      throw new BadRequestException('Você não pode excluir o próprio usuário.');
    }

    if (user.isActive && this.hasAdminRole(user)) {
      await this.ensureAnotherActiveAdmin(id);
    }

    await this.usersRepository.softDelete(id);
  }

  private async ensureEmailAvailable(email?: string, currentUserId?: number) {
    if (!email) return;
    const existing = await this.usersRepository.findOne({
      where: { email },
      withDeleted: true,
    });
    if (existing && Number(existing.id) !== Number(currentUserId)) {
      throw new BadRequestException('Já existe um usuário com este e-mail.');
    }
  }

  private hasAdminRole(user: Pick<User, 'roles'>) {
    return (user.roles || []).some((role) => role.code === 'ADMIN');
  }

  private rolesIncludeSecurityManager(roles: User['roles']) {
    return (roles || []).some((role) => {
      if (role.code === 'ADMIN') return true;
      return (role.permissions || []).some(
        (permission) => permission.code === 'cadastros.permissions.manage',
      );
    });
  }

  private async ensureAnotherActiveAdmin(userId: number) {
    const admins = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.code = :code', { code: 'ADMIN' })
      .andWhere('user.is_active = true')
      .andWhere('user.deleted_at IS NULL')
      .andWhere('user.id <> :userId', { userId })
      .getCount();

    if (admins < 1) {
      throw new BadRequestException(
        'Não é permitido remover o último administrador ativo.',
      );
    }
  }
}
