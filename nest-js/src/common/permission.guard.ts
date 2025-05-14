import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Decoratör'den gereken izin(ler)i al
    const requiredPermission = this.reflector.get<string>('permissionKey', context.getHandler());
    const requiredPermissions = this.reflector.get<string[]>('permissionKeys', context.getHandler());
    
    // Eğer izin gerektiren bir route değilse, erişime izin ver
    if (!requiredPermission && (!requiredPermissions || requiredPermissions.length === 0)) {
      return true;
    }
    
    // Request'ten user nesnesini al
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Kullanıcı kontrolü
    if (!user) {
      throw new ForbiddenException('Kullanıcı bulunamadı');
    }
    
    // System Admin ise tüm izinlere sahip
    if (user.role === 'System Admin') {
      console.log(`Permission bypass for System Admin (${requiredPermission || requiredPermissions})`);
      return true;
    }
    
    // Tekli izin kontrolü
    if (requiredPermission) {
      const hasPermission = user.permissions && user.permissions[requiredPermission] === true;
      console.log(`Permission check: ${requiredPermission} - user: ${user.id} - has permission: ${hasPermission}`);
      if (hasPermission) return true;
    }
    
    // Çoklu izin kontrolü (herhangi biri yeterli)
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAnyPermission = requiredPermissions.some(
        (perm) => user.permissions && user.permissions[perm] === true
      );
      console.log(`Permissions check: [${requiredPermissions.join(', ')}] - user: ${user.id} - has any: ${hasAnyPermission}`);
      if (hasAnyPermission) return true;
    }
    
    throw new ForbiddenException({
      message: `Bu işlemi yapmak için gerekli yetkilere sahip olmalısınız`,
      error: 'Permission Denied',
      required: requiredPermissions || [requiredPermission]
    });
  }
} 