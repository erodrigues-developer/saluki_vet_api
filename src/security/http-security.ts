import { Request, Response, NextFunction } from 'express';
import { securityConfig } from './security.config';
export function httpSecurity(req: Request, res: Response, next: NextFunction) {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  if (!securityConfig().production && process.env.SWAGGER_ENABLED === 'true' && req.path.startsWith('/docs')) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  }
  res.setHeader('Cache-Control', 'no-store');
  if (securityConfig().production) res.setHeader('Strict-Transport-Security', `max-age=${securityConfig().hstsMaxAge}`);
  next();
}
