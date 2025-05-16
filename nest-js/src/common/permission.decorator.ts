import { SetMetadata } from '@nestjs/common';


export const Permission = (permissionKey: string) => SetMetadata('permissionKey', permissionKey);

export const Permissions = (...permissionKeys: string[]) => SetMetadata('permissionKeys', permissionKeys); 