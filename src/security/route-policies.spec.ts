import 'reflect-metadata';
import { readdirSync } from 'fs';
import { join } from 'path';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { PERMISSIONS_KEY } from '../common/decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { AUTHENTICATED_KEY } from '../common/decorators/authenticated.decorator';
const walk = (dir: string): string[] => readdirSync(dir, {withFileTypes: true}).flatMap((f) => f.isDirectory() ? walk(join(dir,f.name)) : [join(dir,f.name)]);
describe('Route security classification', () => {
  const files = walk(join(__dirname, '..')).filter((f) => f.endsWith('.controller.ts'));
  for (const file of files) {
    it(file.split('/src/')[1], () => {
      const exported = require(file);
      for (const cls of Object.values(exported) as any[]) {
        if (typeof cls !== 'function' || !Reflect.hasMetadata(PATH_METADATA,cls)) continue;
        for (const name of Object.getOwnPropertyNames(cls.prototype)) {
          const method = cls.prototype[name];
          if (!Reflect.hasMetadata(METHOD_METADATA,method)) continue;
          const permissions = Reflect.getMetadata(PERMISSIONS_KEY,method) ?? Reflect.getMetadata(PERMISSIONS_KEY,cls);
          const publicRoute = Reflect.getMetadata(IS_PUBLIC_KEY,method) ?? Reflect.getMetadata(IS_PUBLIC_KEY,cls);
          const identity = Reflect.getMetadata(AUTHENTICATED_KEY,method) ?? Reflect.getMetadata(AUTHENTICATED_KEY,cls);
          expect({route: `${cls.name}.${name}`, classified: Boolean(permissions?.length || publicRoute || identity)}).toEqual({route: `${cls.name}.${name}`, classified: true});
        }
      }
    });
  }
});
