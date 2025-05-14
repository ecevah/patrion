import { SetMetadata } from '@nestjs/common';

// Tekli izin için
export const Permission = (permissionKey: string) => SetMetadata('permissionKey', permissionKey);
// Çoklu izin için
export const Permissions = (...permissionKeys: string[]) => SetMetadata('permissionKeys', permissionKeys); 