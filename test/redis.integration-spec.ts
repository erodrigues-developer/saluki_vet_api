import Redis from 'ioredis';
import RedisService from '../src/modules/redis/services/redis.service';
import { SessionService, sessionKey } from '../src/security/session.service';
describe('Session lifecycle with disposable real Redis',()=>{
  let client:Redis;let storage:RedisService;let sessions:SessionService;
  const user={id:1,isActive:true,updatedAt:'test',roles:[]};
  const issued:string[]=[];
  beforeAll(async()=>{
    if(process.env.SECURITY_REDIS_URL!=='redis://127.0.0.1:36379')throw Error('Exige Redis descartável em 127.0.0.1:36379; não usar banco real');
    process.env.NODE_ENV='test';delete process.env.APP_ORIGINS;
    client=new Redis(process.env.SECURITY_REDIS_URL,{maxRetriesPerRequest:1});storage=new RedisService(client);sessions=new SessionService(storage,{findOne:async()=>user} as any);
  });
  afterAll(async()=>{if(client){for(const id of issued)await client.del(sessionKey(id));await client.quit();}});
  const create=async()=>{const result=await sessions.create(user);issued.push(result.id);return result;};
  it('atomic set has idle TTL and valid session resolves identity',async()=>{
    const s=await create();const ttl=await client.ttl(sessionKey(s.id));expect(ttl).toBeGreaterThan(0);expect(ttl).toBeLessThanOrEqual(1800);expect((await sessions.validate(s.id)).user.id).toBe(1);
  });
  it('revoked session cannot be touched back into existence',async()=>{
    const s=await create();const key=sessionKey(s.id);const raw=await client.get(key);await sessions.revoke(s.id);
    expect(await storage.touchIfEqual(key,raw!,1800)).toBe(false);expect(await client.exists(key)).toBe(0);await expect(sessions.validate(s.id)).rejects.toThrow();
  });
  it('actual Redis expiry rejects the session',async()=>{
    const s=await create();await client.pexpire(sessionKey(s.id),25);await new Promise(resolve=>setTimeout(resolve,60));await expect(sessions.validate(s.id)).rejects.toThrow();
  });
  it('only one concurrent rotation succeeds and old id fails',async()=>{
    const s=await create();const outcomes=await Promise.allSettled([sessions.rotate(s.id),sessions.rotate(s.id)]);const successes=outcomes.filter((r)=>r.status==='fulfilled') as PromiseFulfilledResult<any>[];
    expect(successes).toHaveLength(1);issued.push(successes[0].value.id);await expect(sessions.validate(s.id)).rejects.toThrow();expect((await sessions.validate(successes[0].value.id)).user.id).toBe(1);
  });
  it('rate counter increment and TTL are atomic',async()=>{
    const key='sigmavet:test:rate';await client.del(key);
    const values=await Promise.all(Array.from({length:12},()=>storage.incrementWithExpiry(key,900)));expect(new Set(values).size).toBe(12);expect(await client.ttl(key)).toBeGreaterThan(0);await client.del(key);
  });
});
