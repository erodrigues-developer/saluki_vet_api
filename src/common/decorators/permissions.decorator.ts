import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const ALL_PERMISSIONS_KEY = 'allPermissions';
export const AllPermissions = (...permissions: string[]) => (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
  SetMetadata(PERMISSIONS_KEY, permissions)(target, key!, descriptor!);
  SetMetadata(ALL_PERMISSIONS_KEY, true)(target, key!, descriptor!);
};
