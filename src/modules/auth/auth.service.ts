import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailForAuth(loginDto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const permissions = [
      ...new Set(
        (user.roles || []).flatMap((role) =>
          (role.permissions || []).map((permission) => permission.code),
        ),
      ),
    ].sort();
    const roles = (user.roles || []).map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
    }));

    const payload = {
      email: user.email,
      sub: user.id,
      roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
        permissions,
      },
    };
  }

  async me(userId: number) {
    const user = await this.usersService.findOne(userId);
    const permissions = [
      ...new Set(
        (user.roles || []).flatMap((role) =>
          (role.permissions || []).map((permission) => permission.code),
        ),
      ),
    ].sort();
    const roles = (user.roles || []).map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
    }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles,
      permissions,
    };
  }
}
