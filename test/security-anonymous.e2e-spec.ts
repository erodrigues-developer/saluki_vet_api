import 'reflect-metadata';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Test } from '@nestjs/testing';
import { PATH_METADATA } from '@nestjs/common/constants';
import { UnauthorizedException, VersioningType } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { SessionService } from '../src/security/session.service';
const walk=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(join(dir,f.name)):[join(dir,f.name)]);
const controllers=walk(join(__dirname,'../src')).filter(f=>f.endsWith('.controller.ts')).flatMap(f=>Object.values(require(f))).filter((c:any)=>typeof c==='function' && Reflect.hasMetadata(PATH_METADATA,c)) as any[];
const paths=JSON.parse(readFileSync(join(__dirname,'security/original-get-paths.json'),'utf8')) as string[];
describe('All 56 anonymous GET cases from the original pentest',()=>{
  let app:any;
  beforeAll(async()=>{
    const tokens=new Set(controllers.flatMap(c=>Reflect.getMetadata('design:paramtypes',c)||[]));
    const sessions={validate:async()=>{throw new UnauthorizedException();}};
    const providers=[...tokens].filter(t=>t!==SessionService).map(token=>({provide:token,useValue:{}}));
    const mod=await Test.createTestingModule({controllers,providers:[...providers,Reflector,{provide:SessionService,useValue:sessions}]}).compile();
    app=mod.createNestApplication();app.setGlobalPrefix('api');app.enableVersioning({type:VersioningType.URI,defaultVersion:'1'});
    app.useGlobalGuards(new JwtAuthGuard(mod.get(Reflector),sessions as any),new PermissionsGuard(mod.get(Reflector)),new RolesGuard(mod.get(Reflector)));
    await app.init();await app.listen(0,'127.0.0.1');
  });
  afterAll(async()=>{if(app)await app.close();});
  it.each(paths)('%s requires authentication',async(path)=>{await request(app.getHttpServer()).get(path).expect(401);});
});
