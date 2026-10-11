import { Controller, Get, VERSION_NEUTRAL, Req, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { safeEqual } from './security/session.service';
@Controller({ path: '', version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Public()
  @Get()
  getHealth() { return { status: 'ok' }; } // liveness never probes remote dependencies
  private authorizeMonitor(req: any) {
    const secret = process.env.MONITORING_TOKEN || '';
    if (secret.length < 32 || !safeEqual(String(req.headers.authorization || ''), `Bearer ${secret}`)) throw new ForbiddenException();
  }
  @Public()
  @Get('health/diagnostics')
  async diagnostics(@Req() req: any) { this.authorizeMonitor(req); return this.appService.getHealth(); }
  @Public()
  @Get('health/ready')
  async ready(@Req() req: any) {
    this.authorizeMonitor(req);
    const health = await this.appService.getHealth();
    if (health.status !== 'ok') throw new ServiceUnavailableException('Serviço indisponível');
    return { status: 'ok' };
  }
}
