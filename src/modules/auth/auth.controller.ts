import { Body, Controller, Get, Post, Req, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Authenticated } from '../../common/decorators/authenticated.decorator';
import { securityConfig } from '../../security/security.config';
import { assertBrowserRequest, readSessionCookie } from '../../security/csrf';
import { SessionService } from '../../security/session.service';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
@Authenticated()
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly sessions: SessionService) {}
  private setCookie(res: Response, id: string, expiresAt: number) {
    const cfg = securityConfig();
    res.cookie(cfg.cookieName, id, { httpOnly: true, secure: cfg.production, sameSite: 'lax', path: '/', expires: new Date(expiresAt) });
    for (const name of ['auth_token', 'auth_user']) res.clearCookie(name, { path: '/' });
  }
  @Public()
  @Post('login')
  @Header('Cache-Control', 'no-store')
  async login(@Body() dto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    assertBrowserRequest(req);
    const result = await this.authService.login(dto);
    // Reauthentication replaces the old session rather than fixing its identifier.
    await this.sessions.revoke(readSessionCookie(req));
    this.setCookie(res, result.id, result.session.expiresAt);
    return { data: { user: result.user, csrfToken: result.session.csrf } };
  }
  @Get('me')
  @Header('Cache-Control', 'no-store')
  async me(@Req() req: any) {
    return { data: { user: await this.authService.me(Number(req.user.userId)), csrfToken: req.session.csrf } };
  }
  @Post('renew')
  @Header('Cache-Control', 'no-store')
  async renew(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.sessions.rotate(req.session.id);
    this.setCookie(res, result.id, result.session.expiresAt);
    return { data: { user: await this.authService.me(Number(req.user.userId)), csrfToken: result.session.csrf } };
  }
  @Post('logout')
  @Header('Cache-Control', 'no-store')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.sessions.revoke(req.session.id);
    res.clearCookie(securityConfig().cookieName, { httpOnly: true, secure: securityConfig().production, sameSite: 'lax', path: '/' });
    return { data: { loggedOut: true } };
  }
}
