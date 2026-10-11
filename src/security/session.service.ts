import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { UsersService } from '../modules/users/users.service';
import RedisService from '../modules/redis/services/redis.service';
import { securityConfig } from './security.config';

type Session = { userId: number; csrf: string; expiresAt: number; fingerprint: string };
export const sessionFingerprint = (user: any) => createHash('sha256').update(JSON.stringify({
  active: user.isActive, updated: user.updatedAt,
  roles: (user.roles || []).map((role: any) => ({ code: role.code,
    permissions: (role.permissions || []).map((p: any) => p.code).sort() })).sort((a: any, b: any) => a.code.localeCompare(b.code)),
})).digest('hex');
export const sessionKey = (id: string) => `sigmavet:session:${createHash('sha256').update(id).digest('hex')}`;
export const safeEqual = (a: string, b: string) => Boolean(a && b && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b)));

@Injectable()
export class SessionService {
  constructor(private readonly redis: RedisService, private readonly users: UsersService) {}
  async create(user: any, expiresAt = Date.now() + securityConfig().absoluteSeconds * 1000) {
    const id = randomBytes(32).toString('hex');
    const session: Session = { userId: Number(user.id), csrf: randomBytes(32).toString('hex'), expiresAt, fingerprint: sessionFingerprint(user) };
    const ttl = Math.min(securityConfig().idleSeconds, Math.ceil((expiresAt - Date.now()) / 1000));
    if (ttl <= 0) throw new UnauthorizedException();
    await this.redis.set(sessionKey(id), JSON.stringify(session), ttl);
    return { id, session };
  }
  async validate(id: string) {
    if (!/^[a-f0-9]{64}$/.test(id || '')) throw new UnauthorizedException();
    const key = sessionKey(id);
    const raw = await this.redis.get(key);
    if (!raw) throw new UnauthorizedException();
    const session = JSON.parse(raw) as Session;
    let user: any;
    try { user = await this.users.findOne(session.userId); }
    catch { await this.redis.delete(key); throw new UnauthorizedException(); }
    if (!user.isActive || session.expiresAt <= Date.now() || session.fingerprint !== sessionFingerprint(user)) {
      await this.redis.delete(key); throw new UnauthorizedException();
    }
    // Compare-and-touch never recreates a session concurrently revoked by logout.
    const ttl = Math.min(securityConfig().idleSeconds, Math.ceil((session.expiresAt - Date.now()) / 1000));
    if (!await this.redis.touchIfEqual(key, raw, ttl)) throw new UnauthorizedException();
    return { session, user, raw };
  }
  async revoke(id: string) { if (id) await this.redis.delete(sessionKey(id)); }
  async rotate(id: string) {
    const { session, user, raw } = await this.validate(id);
    // Single winner on concurrent renewal; the old identifier becomes unusable.
    if (!await this.redis.deleteIfEqual(sessionKey(id), raw)) throw new UnauthorizedException();
    return this.create(user, session.expiresAt);
  }
  async loginAllowed(identity: string) {
    const key = `sigmavet:login:${createHash('sha256').update(identity.toLowerCase()).digest('hex')}`;
    return (await this.redis.incrementWithExpiry(key, 900)) <= 10;
  }
}
