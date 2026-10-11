import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions, AllPermissions } from '../common/decorators/permissions.decorator';
import { Authenticated } from '../common/decorators/authenticated.decorator';
import { SessionService, sessionFingerprint, sessionKey } from './session.service';
import { validateRaster, validateFileContent } from './uploads';
import { assertReportAccess } from './file-access';
import { safeRequestLog } from './safe-log';
import { DashboardService } from '../modules/dashboard/dashboard.service';
import { UsersService } from '../modules/users/users.service';
import { FileStorageService } from '../modules/file-storage/file-storage.service';
import { FilesController } from '../modules/file-storage/files.controller';
import { UsersController } from '../modules/users/users.controller';
import { AccountsPayableController } from '../modules/accounts-payable/accounts-payable.controller';
import { ReportsService } from '../modules/reports/reports.service';
@Permissions('class.read')
class Policy {
  @Permissions('first','second') either() {}
  @AllPermissions('first','second') both() {}
  inherited() {}
}
class Missing { action() {} }
@Authenticated() class Identity { action() {} }
const ctx = (cls: any, method: string, user: any) => ({getHandler:()=>cls.prototype[method],getClass:()=>cls,switchToHttp:()=>({getRequest:()=>({user})})}) as any;
describe('Security regression',()=>{
  it('method overrides class, explicit any/all, inherited permissions and missing policy fail closed',()=>{
    const guard=new PermissionsGuard(new Reflector());const user={permissions:['first'],roles:[]};
    expect(guard.canActivate(ctx(Policy,'either',user))).toBe(true);
    expect(guard.canActivate(ctx(Policy,'both',user))).toBe(false);
    expect(guard.canActivate(ctx(Policy,'inherited',user))).toBe(false);
    expect(guard.canActivate(ctx(Missing,'action',{roles:[{code:'ADMIN'}]}))).toBe(false);
    expect(guard.canActivate(ctx(Identity,'action',user))).toBe(true);
    expect(guard.canActivate(ctx(Identity,'action',null))).toBe(false);
  });
  it('administrative routes reject every unrelated catalog permission',()=>{
    const { PERMISSIONS: PERMISSIONS_CATALOG } = require('../modules/permissions/permissions.catalog');
    const guard = new PermissionsGuard(new Reflector());
    for (const entry of PERMISSIONS_CATALOG) {
      const user = {permissions:[entry.code],roles:[]};
      expect(guard.canActivate(ctx(UsersController,'findAll',user))).toBe(entry.code === 'cadastros.users.view');
      expect(guard.canActivate(ctx(UsersController,'findOne',user))).toBe(entry.code === 'cadastros.users.view');
      expect(guard.canActivate(ctx(AccountsPayableController,'getDashboard',user))).toBe(entry.code === 'financeiro.accounts_payable.view');
    }
  });
  it('all built-in roles obey administrative and payable policies',()=>{
    const { ROLE_PERMISSION_CODES } = require('../modules/permissions/permissions.catalog');
    const guard = new PermissionsGuard(new Reflector());
    for (const [code, permissions] of Object.entries(ROLE_PERMISSION_CODES) as [string,string[]][]) {
      const user = {roles:[{code}], permissions};
      expect(guard.canActivate(ctx(UsersController,'findAll',user))).toBe(code === 'ADMIN' || permissions.includes('cadastros.users.view'));
      expect(guard.canActivate(ctx(AccountsPayableController,'getDashboard',user))).toBe(code === 'ADMIN' || permissions.includes('financeiro.accounts_payable.view'));
    }
  });
  it('session fingerprint changes with role permissions, user updates and deactivation',()=>{
    const user={isActive:true,updatedAt:'one',roles:[{code:'CASHIER',permissions:[]}]};const fingerprint=sessionFingerprint(user);
    expect(sessionFingerprint({...user,updatedAt:'two'})).not.toBe(fingerprint);
    expect(sessionFingerprint({...user,isActive:false})).not.toBe(fingerprint);
    expect(sessionFingerprint({...user,roles:[{code:'CASHIER',permissions:[{code:'read'}]}]})).not.toBe(fingerprint);
  });
  it('revocation during validation is never resurrected',async()=>{
    process.env.NODE_ENV='test';delete process.env.APP_ORIGINS;
    const user={id:1,isActive:true,roles:[]};const value=JSON.stringify({userId:1,csrf:'csrf',expiresAt:Date.now()+100000,fingerprint:sessionFingerprint(user)});
    const redis={get:jest.fn().mockResolvedValue(value),touchIfEqual:jest.fn().mockResolvedValue(false),delete:jest.fn()};
    const sessions=new SessionService(redis as any,{findOne:async()=>user} as any);
    await expect(sessions.validate('a'.repeat(64))).rejects.toThrow();expect(redis.touchIfEqual).toHaveBeenCalled();
  });
  it('session creation fails closed on Redis outage',async()=>{
    const sessions=new SessionService({set:async()=>{throw Error('unavailable');}} as any,{} as any);
    await expect(sessions.create({id:1,isActive:true,roles:[]})).rejects.toThrow('unavailable');
  });
  it.each(['image/svg+xml','image/png','image/jpeg','image/webp'])('rejects HTML masquerading as %s',mime=>{expect(()=>validateRaster(Buffer.from('<svg onload="alert(1)">'),mime)).toThrow();});
  it('accepts raster signature and rejects fake PDF/office documents',()=>{
    expect(()=>validateRaster(Buffer.from([137,80,78,71,13,10,26,10]),'image/png')).not.toThrow();
    expect(()=>validateFileContent(Buffer.from('<html>'),'application/pdf')).toThrow();
    expect(()=>validateFileContent(Buffer.from('<html>'),'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toThrow();
  });
  it('storage prevents traversal and actual buffer size bypass',async()=>{
    const storage=new FileStorageService({get:()=> 'test'} as any,{} as any);
    await expect(storage.readBinaryFile('../secrets')).rejects.toThrow();
    await expect(storage.readBinaryFile('reports/../../secrets')).rejects.toThrow();
    await expect(storage.uploadBinaryFile({buffer:Buffer.alloc(100),size:1,mimetype:'text/plain'},{folder:'reports',requestBaseUrl:'',maxFileSizeBytes:50})).rejects.toThrow();
  });
  it('lookup queries eligible active veterinarians with minimal projection',async()=>{
    const qb:any={};for(const key of ['innerJoin','select','distinct','where','andWhere','orderBy'])qb[key]=jest.fn().mockReturnValue(qb);
    qb.getRawMany=jest.fn().mockResolvedValue([{id:'5',name:'Vet',email:'forbidden',roles:['ADMIN']}]);
    const service=new UsersService({createQueryBuilder:()=>qb} as any,{} as any);
    expect(await service.lookupProfessionals()).toEqual({data:[{id:5,name:'Vet'}]});
    expect(qb.innerJoin).toHaveBeenCalledWith('user.roles','role','role.code IN (:...codes)',{codes:['VET','VETERINARIAN']});
    expect(qb.where).toHaveBeenCalledWith('user.is_active = true');
    await expect(service.lookupProfessional(1)).rejects.toThrow();
  });
  it('overview never queries or returns accounts payable for restricted role',async()=>{
    const db={query:jest.fn().mockResolvedValue([]),manager:{}};
    const service=new DashboardService(db as any,{getSettings:async()=>({})} as any,{getStockBalance:async()=>({data:[],meta:{total:0}})} as any,{getDueOverview:async()=>({})} as any);
    const result=await service.getOverview({roles:[],permissions:['dashboard.view']});
    expect(result.finance.payables).toBeUndefined();expect(result.finance.expenseCategories).toBeUndefined();expect(result.finance.openSales).toBeUndefined();
    expect(db.query.mock.calls.some(([sql])=>String(sql).includes('accounts_payable'))).toBe(false);
  });
  it('report downloads enforce financial domain and object ownership',()=>{
    const user={userId:2,roles:[],permissions:['relatorios.reports.download','dashboard.view']};
    expect(()=>assertReportAccess(user,'ACCOUNTS_PAYABLE_BY_DUE_DATE',2)).toThrow();
    user.permissions.push('financeiro.accounts_payable.view');expect(()=>assertReportAccess(user,'ACCOUNTS_PAYABLE_BY_DUE_DATE',2)).not.toThrow();
    expect(()=>assertReportAccess(user,'ACCOUNTS_PAYABLE_BY_DUE_DATE',1)).toThrow();
    expect(()=>assertReportAccess(user,'UNKNOWN',2)).toThrow();
  });
  it('report service also rechecks ownership and current domain permission',async()=>{
    const reader={id:2,isActive:true,roles:[{code:'CASHIER',permissions:[{code:'financeiro.accounts_payable.view'}]}]};
    const service=new ReportsService(...Array(9).fill({}) as [any,any,any,any,any,any,any,any,any],{findOne:async()=>reader} as any,{} as any);
    await expect((service as any).ensureCanAccess({reportType:'ACCOUNTS_PAYABLE_BY_DUE_DATE',requestedByUserId:1},2)).rejects.toThrow();
    await expect((service as any).ensureCanAccess({reportType:'ACCOUNTS_PAYABLE_BY_DUE_DATE',requestedByUserId:2},2)).resolves.toBeUndefined();
    reader.roles[0].permissions=[];await expect((service as any).ensureCanAccess({reportType:'ACCOUNTS_PAYABLE_BY_DUE_DATE',requestedByUserId:2},2)).rejects.toThrow();
  });
  it('private download rejects wrong owner and emits safe headers for authorized reader',async()=>{
    const key='reports/11111111-1111-1111-1111-111111111111.xlsx';
    const db={query:jest.fn().mockResolvedValue([{report_type:'ACCOUNTS_PAYABLE_BY_DUE_DATE',requested_by_user_id:2,mime_type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}])};
    const storage={readBinaryFile:jest.fn().mockResolvedValue(Buffer.from('file'))};
    const controller=new FilesController(storage as any,db as any);
    const user={userId:1,roles:[],permissions:['relatorios.reports.download','financeiro.accounts_payable.view']};
    const res={setHeader:jest.fn(),send:jest.fn()};
    await expect(controller.download(key,{user},res as any)).rejects.toThrow();expect(storage.readBinaryFile).not.toHaveBeenCalled();
    user.userId=2;await controller.download(key,{user},res as any);expect(res.setHeader).toHaveBeenCalledWith('Cache-Control','no-store');expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition',expect.stringContaining('attachment;'));
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE storage_key = $1'),[key]);
  });
  it('private download never exposes certificate or traversed storage paths',async()=>{
    const storage={readBinaryFile:jest.fn()};const controller=new FilesController(storage as any,{} as any);
    for(const key of ['fiscal/certificates/1/secret.pfx','reports/../../secret','unrecognized/file.pdf'])await expect(controller.download(key,{user:{roles:[{code:'ADMIN'}]}},{} as any)).rejects.toThrow();
    expect(storage.readBinaryFile).not.toHaveBeenCalled();
  });
  it('security logs omit credentials, personal data, headers and queries',()=>{
    const log=safeRequestLog({method:'POST',originalUrl:'/api/v1/auth/login?token=secret',headers:{cookie:'secret'},body:{password:'secret'},user:{userId:1}});
    expect(log).toEqual({method:'POST',path:'/api/v1/auth/login',userId:1});expect(JSON.stringify(log)).not.toContain('secret');
  });
});
