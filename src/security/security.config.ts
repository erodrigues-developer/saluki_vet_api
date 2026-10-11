export function securityConfig() {
  const production = process.env.NODE_ENV === 'production';
  const origins = (process.env.APP_ORIGINS || (production ? '' : 'http://localhost:3001,http://127.0.0.1:3001')).split(',').filter(Boolean);
  if (!origins.length || origins.some((origin) => {
    try { const url = new URL(origin); return url.origin !== origin || (production && url.protocol !== 'https:'); }
    catch { return true; }
  })) throw new Error('APP_ORIGINS deve conter origens exatas (HTTPS em produção)');
  const seconds = (name: string, fallback: number) => {
    const value = Number(process.env[name] || fallback);
    if (!Number.isSafeInteger(value) || value < 60) throw new Error(`${name} inválido`);
    return value;
  };
  const hstsMaxAge = Number(process.env.HSTS_MAX_AGE || 300);
  if (!Number.isSafeInteger(hstsMaxAge) || hstsMaxAge < 0) throw new Error('HSTS_MAX_AGE inválido');
  return {
    hstsMaxAge,
    production, origins,
    cookieName: production ? '__Host-sigmavet_session' : 'sigmavet_session',
    absoluteSeconds: seconds('SESSION_ABSOLUTE_SECONDS', 28800),
    idleSeconds: seconds('SESSION_IDLE_SECONDS', 1800),
  };
}
