import * as request from 'supertest';
import { createHarness } from './security/harness';
import { sessionKey } from '../src/security/session.service';
import { securityConfig } from '../src/security/security.config';

describe('Sigmavet remediation (isolated HTTP integration)', () => {
  let harness: Awaited<ReturnType<typeof createHarness>>;
  const origin = 'http://127.0.0.1:3001';
  const headers = {Origin: origin,'X-Sigmavet-Request':'1'};
  const api = () => request(harness.app.getHttpServer());
  const login = async (role = 'CASHIER') => {
    const result = await api().post('/api/v1/auth/login').set(headers).send({email:`${role.toLowerCase()}@example.test`,password:'Ficticia-2026!'}).expect(201);
    return {cookie: result.headers['set-cookie'][0].split(';')[0],csrf:result.body.data.csrfToken,body:result.body};
  };
  beforeEach(async()=>{harness=await createHarness();});
  afterEach(async()=>{await harness.app.close();});
  it.each(['/api/v1/users','/api/v1/users/1','/api/v1/accounts-payable','/api/v1/accounts-payable/dashboard'])('anonymous rejected %s',async(path)=>{await api().get(path).expect(401);});
  it.each(['/api/v1/users','/api/v1/users/1','/api/v1/accounts-payable','/api/v1/accounts-payable/dashboard'])('CASHIER denied %s',async(path)=>{const s=await login();await api().get(path).set('Cookie',s.cookie).expect(403);});
  it.each(['ADMIN','READER'])('authorized %s retains list, object and finance',async(role)=>{
    const s=await login(role);for(const path of ['/api/v1/users','/api/v1/users/1','/api/v1/accounts-payable/dashboard']) await api().get(path).set('Cookie',s.cookie).expect(200);
  });
  it('sales permission permits minimal lookup, not administrative data',async()=>{
    const s=await login();const r=await api().get('/api/v1/users/lookup').set('Cookie',s.cookie).expect(200);expect(r.body).toEqual({data:[{id:5,name:'Veterinário'}]});
    const n=await login('NONE');await api().get('/api/v1/users/lookup').set('Cookie',n.cookie).expect(403);
  });
  it('no bearer in body and session is HttpOnly, scoped and no-store',async()=>{
    const result=await api().post('/api/v1/auth/login').set(headers).send({email:'cashier@example.test',password:'Ficticia-2026!'}).expect(201);
    expect(result.body.data.access_token).toBeUndefined();expect(result.body.data.id).toBeUndefined();
    expect(result.headers['set-cookie'][0]).toMatch(/HttpOnly/);expect(result.headers['set-cookie'][0]).toMatch(/SameSite=Lax/);expect(result.headers['set-cookie'][0]).not.toMatch(/Domain=/);
    expect(result.headers['cache-control']).toBe('no-store');
  });
  it.each([{}, {'Origin':'https://attacker.test','X-Sigmavet-Request':'1'}, {'Origin':origin}])('login CSRF/origin protections %j',async(h)=>{await api().post('/api/v1/auth/login').set(h).send({email:'cashier@example.test',password:'Ficticia-2026!'}).expect(403);});
  it('authenticated CSRF rejected; authorized logout revokes direct replay',async()=>{
    const s=await login();await api().post('/api/v1/auth/logout').set('Cookie',s.cookie).set(headers).expect(403);
    await api().post('/api/v1/auth/logout').set('Cookie',s.cookie).set({...headers,'X-CSRF-Token':s.csrf}).expect(201);
    await api().get('/api/v1/auth/me').set('Cookie',s.cookie).expect(401);
  });
  it('renewal rotates id and rejects old identifier and old CSRF',async()=>{
    const s=await login();const r=await api().post('/api/v1/auth/renew').set('Cookie',s.cookie).set({...headers,'X-CSRF-Token':s.csrf}).expect(201);
    const cookie=r.headers['set-cookie'][0].split(';')[0];expect(cookie).not.toBe(s.cookie);
    await api().get('/api/v1/auth/me').set('Cookie',s.cookie).expect(401);
    await api().post('/api/v1/auth/logout').set('Cookie',cookie).set({...headers,'X-CSRF-Token':s.csrf}).expect(403);
  });
  it('privilege changes and user deactivation invalidate session',async()=>{
    const s=await login();harness.users[1].roles[0].permissions.push({code:'cadastros.users.view'});await api().get('/api/v1/auth/me').set('Cookie',s.cookie).expect(401);
    const t=await login();harness.users[1].isActive=false;await api().get('/api/v1/auth/me').set('Cookie',t.cookie).expect(401);
  });
  it('absolute and idle expiration rejected',async()=>{
    const s=await login();const id=s.cookie.split('=')[1];const row=harness.records.get(sessionKey(id))!;const value=JSON.parse(row.value);value.expiresAt=Date.now()-1;row.value=JSON.stringify(value);
    await api().get('/api/v1/auth/me').set('Cookie',s.cookie).expect(401);
    const t=await login();harness.records.get(sessionKey(t.cookie.split('=')[1]))!.until=Date.now()-1;await api().get('/api/v1/auth/me').set('Cookie',t.cookie).expect(401);
  });
  it.each(['changed.signature','eyJhbGciOiJub25lIn0.e30.','malformed','changed-role'])('legacy/adulterated bearer rejected: %s',async(token)=>{await api().get('/api/v1/auth/me').set('Authorization',`Bearer ${token}`).expect(401);});
  it('missing permission metadata denies even ADMIN',async()=>{const s=await login('ADMIN');await api().get('/api/v1/unclassified').set('Cookie',s.cookie).expect(403);});
  it('liveness exposes minimum; diagnostics require separate secret',async()=>{
    const r=await api().get('/api').expect(200);expect(r.body).toEqual({status:'ok'});await api().get('/api/health/diagnostics').expect(403);
    process.env.MONITORING_TOKEN='m'.repeat(40);await api().get('/api/health/diagnostics').set('Authorization',`Bearer ${process.env.MONITORING_TOKEN}`).expect(200);delete process.env.MONITORING_TOKEN;
  });
  it.each([200,401,403,404])('headers on status %s',async(status)=>{
    const path=status===200?'/api':status===401?'/api/v1/users':status===403?'/api/health/diagnostics':'/missing';
    const r=await api().get(path).expect(status);expect(r.headers['content-security-policy']).toContain("frame-ancestors 'none'");expect(r.headers['x-content-type-options']).toBe('nosniff');expect(r.headers['cache-control']).toBe('no-store');
  });
  it('production secure host cookie and HSTS on errors',async()=>{
    process.env.NODE_ENV='production';process.env.APP_ORIGINS='https://app.sigmavet.test';
    const r=await api().post('/api/v1/auth/login').set({Origin:'https://app.sigmavet.test','X-Sigmavet-Request':'1'}).send({email:'cashier@example.test',password:'Ficticia-2026!'}).expect(201);
    expect(r.headers['set-cookie'][0]).toMatch(/^__Host-sigmavet_session=.*; Path=\/;.*HttpOnly; Secure;/);expect(r.headers['strict-transport-security']).toBe('max-age=300');
    expect((await api().get('/missing').expect(404)).headers['strict-transport-security']).toBe('max-age=300');
  });
  it('rate limit prevents excessive login attempts',async()=>{
    for(let i=0;i<10;i++) await api().post('/api/v1/auth/login').set(headers).send({email:'invalid@example.test',password:'invalid'}).expect(401);
    await api().post('/api/v1/auth/login').set(headers).send({email:'invalid@example.test',password:'invalid'}).expect(429);
  });
});
