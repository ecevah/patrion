import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Company } from './entities/company.entity';
import { User } from './entities/user.entity';
import { Device } from './entities/device.entity';
import { UserDeviceAccess } from './entities/user-device-access.entity';
import { Log } from './entities/log.entity';
import { UserAuthService } from './user/services/user-auth.service';
import { UserAuthController } from './user/controllers/user-auth.controller';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { LogService } from './log/log.service';
import { UserService } from './user/services/user.service';
import { RoleService } from './role/services/role.service';
import { RoleController } from './role/controllers/role.controller';
import { UserController } from './user/controllers/user.controller';
import { CompanyService } from './company/services/company.service';
import { CompanyController } from './company/controllers/company.controller';
import { DeviceService } from './device/services/device.service';
import { DeviceController } from './device/controllers/device.controller';
import { UserDeviceAccessService } from './user-device-access/services/user-device-access.service';
import { UserDeviceAccessController } from './user-device-access/controllers/user-device-access.controller';
import { AuthMiddleware } from './middleware/auth.middleware';
import { PermissionGuard } from './common/permission.guard';
import { LogModule } from './log/log.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'test',
      autoLoadEntities: true,
      synchronize: true,
      entities: [Role, Company, User, Device, UserDeviceAccess, Log],
    }),
    TypeOrmModule.forFeature([Log, User, Role, Company, Device, UserDeviceAccess]),
    LogModule,
  ],
  controllers: [AppController, UserAuthController, UserController, RoleController, CompanyController, DeviceController, UserDeviceAccessController],
  providers: [
    AppService, 
    UserAuthService, 
    LogService, 
    UserService, 
    RoleService, 
    CompanyService, 
    DeviceService, 
    UserDeviceAccessService,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard
    }
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: '/auth/login', method: RequestMethod.POST },
        { path: '/auth/forgot-password', method: RequestMethod.POST },
        { path: '/auth/reset-password', method: RequestMethod.POST }
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
