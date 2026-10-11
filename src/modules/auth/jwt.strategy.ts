import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

function requiredJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('JWT_SECRET obrigatório com pelo menos 32 bytes');
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requiredJwtSecret(),
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findOne(Number(payload.sub));
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    const roles = (user.roles || []).map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
    }));
    const permissions = [
      ...new Set(
        (user.roles || []).flatMap((role) =>
          (role.permissions || []).map((permission) => permission.code),
        ),
      ),
    ].sort();

    return {
      userId: user.id,
      email: user.email,
      roles,
      permissions,
    };
  }
}
