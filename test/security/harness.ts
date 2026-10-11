import { ROLE_PERMISSION_CODES } from '../../src/modules/permissions/permissions.catalog';
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { Controller, Get, Post, ValidationPipe, VersioningType } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthController } from '../../src/modules/auth/auth.controller';
import { AuthService } from '../../src/modules/auth/auth.service';
import { SessionService } from '../../src/security/session.service';
import RedisService from '../../src/modules/redis/services/redis.service';
import { UsersController } from '../../src/modules/users/users.controller';
import { UsersService } from '../../src/modules/users/users.service';
import { AccountsPayableController } from '../../src/modules/accounts-payable/accounts-payable.controller';
import { AccountsPayableService } from '../../src/modules/accounts-payable/accounts-payable.service';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../src/common/guards/permissions.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { httpSecurity } from '../../src/security/http-security';
import { hash } from 'bcrypt';

@Controller('unclassified')
class UnclassifiedController { @Get() read() { return {secret: true}; } }
export async function createHarness(production = false) {
  process.env.NODE_ENV = production ? 'production' : 'test';
  process.env.APP_ORIGINS = production ? 'https://localhost:3443' : 'http://127.0.0.1:3001,http://localhost:3001';
  const passwordHash = await hash('Ficticia-2026!', 4);
  const user = (id: number, code: string, permissions: string[]) => ({id, name: code, email: `${code.toLowerCase()}@example.test`, passwordHash, isActive: true, updatedAt: '2026-10-08T00:00:00Z', roles: [{id, code, name: code, permissions: permissions.map((code) => ({code}))}]});
  const users = [user(1,'ADMIN',[]), user(2,'CASHIER',ROLE_PERMISSION_CODES.CASHIER), user(3,'READER',['cadastros.users.view','financeiro.accounts_payable.view']), user(4,'NONE',[])];
  const records = new Map<string,{value: string; until: number}>();
  const counts = new Map<string,number>();
  const memory = {
    get: async (key: string) => { const row = records.get(key); if (!row || row.until <= Date.now()) return null; return row.value; },
    set: async (key: string,value: string,ttl: number) => { records.set(key,{value,until: Date.now()+ttl*1000}); },
    delete: async (key: string) => { records.delete(key); },
    touchIfEqual: async (key: string,value: string,ttl: number) => { if (await memory.get(key) !== value) return false; records.get(key)!.until=Date.now()+ttl*1000; return true; },
    deleteIfEqual: async (key: string,value: string) => { if (await memory.get(key) !== value) return false; return records.delete(key); },
    incrementWithExpiry: async (key: string) => { const n=(counts.get(key)||0)+1; counts.set(key,n); return n; },
  };
  const userService = {
    findByEmailForAuth: async (email: string) => users.find((u) => u.email === email) || null,
    findOne: async (id: number) => {const u=users.find((u)=>u.id === Number(id)); if(!u) throw Error('missing'); return u;},
    findAll: async () => ({data: users.map(({passwordHash,...u})=>u),meta: {total: users.length}}),
    lookupProfessionals: async () => ({data: [{id: 5,name: 'Veterinário'}]}),
    lookupProfessional: async (id: number) => ({id,name: 'Veterinário'}),
    create: async () => ({id: 6}), update: async () => ({id: 1}), remove: async () => {},
  };
  const testingModule = await Test.createTestingModule({
    controllers: [AuthController,UsersController,AccountsPayableController,AppController,UnclassifiedController],
    providers: [AuthService,SessionService,Reflector,
      {provide: RedisService,useValue: memory}, {provide: UsersService,useValue: userService},
      {provide: AccountsPayableService,useValue: {findAll: async ()=>[],getDashboardMetrics: async()=>({kpis:{totalPending:42},charts:{}})}},
      {provide: AppService,useValue: {getHealth: async()=>({status:'ok',checks:{database:{status:'up'}}})}},
    ],
  }).compile();
  const app = testingModule.createNestApplication();
  app.use(httpSecurity);
  app.useGlobalGuards(new JwtAuthGuard(testingModule.get(Reflector),testingModule.get(SessionService)),new PermissionsGuard(testingModule.get(Reflector)),new RolesGuard(testingModule.get(Reflector)));
  app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
  app.setGlobalPrefix('api'); app.enableVersioning({type:VersioningType.URI,defaultVersion:'1'});
  await app.init();
  await app.listen(require.main === module ? 3300 : 0, '127.0.0.1');
  return {app,users,records,counts,sessions:testingModule.get(SessionService)};
}
if (require.main === module) createHarness(process.env.SECURITY_TEST_PRODUCTION === '1').then(async ({app})=> {console.log('Isolated security API ready on 3300; fictitious users, no database');});
