import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AUTHENTICATED_KEY } from '../decorators/authenticated.decorator';
import { ALL_PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return Boolean(this.reflector.getAllAndOverride<boolean>(AUTHENTICATED_KEY, [context.getHandler(), context.getClass()]) && context.switchToHttp().getRequest().user);
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    const userPermissions = new Set<string>(user.permissions || []);
    const roleCodes = (user.roles || []).map((role: any) => role.code);

    if (roleCodes.includes('ADMIN')) {
      return true;
    }

    const all = this.reflector.getAllAndOverride<boolean>(ALL_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    return all ? requiredPermissions.every((p) => userPermissions.has(p)) : requiredPermissions.some((p) => userPermissions.has(p));
  }
}
