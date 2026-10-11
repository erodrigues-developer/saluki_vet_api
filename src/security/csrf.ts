import { ForbiddenException } from '@nestjs/common';
import { securityConfig } from './security.config';
import { safeEqual } from './session.service';
export function assertBrowserRequest(req: any, csrf?: string) {
  const origin = req.headers.origin;
  if (!securityConfig().origins.includes(origin) || req.headers['x-sigmavet-request'] !== '1') {
    throw new ForbiddenException('Origem não autorizada');
  }
  if (csrf && !safeEqual(String(req.headers['x-csrf-token'] || ''), csrf)) {
    throw new ForbiddenException('CSRF inválido');
  }
}
export function readSessionCookie(req: any) {
  const cookies = String(req.headers.cookie || '').split(';').map((part) => part.trim().split('='));
  const matches = cookies.filter(([name]) => name === securityConfig().cookieName);
  return matches.length === 1 ? matches[0][1] : '';
}
