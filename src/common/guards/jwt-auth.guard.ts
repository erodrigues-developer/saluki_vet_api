import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SessionService } from '../../security/session.service';
import { assertBrowserRequest, readSessionCookie } from '../../security/csrf';

// Name retained for existing controller imports; authentication is now an opaque session.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly sessions: SessionService) {}
  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const req = context.switchToHttp().getRequest();
    if (req.user && req.session) return true; // controllers may repeat the global guard
    const id = readSessionCookie(req);
    const { session, user } = await this.sessions.validate(id);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) assertBrowserRequest(req, session.csrf);
    req.session = { ...session, id };
    req.user = { userId: user.id, email: user.email, roles: (user.roles || []).map((r: any) => ({id: r.id, code: r.code, name: r.name})),
      permissions: [...new Set((user.roles || []).flatMap((r: any) => (r.permissions || []).map((p: any) => p.code)))] };
    return true;
  }
}
