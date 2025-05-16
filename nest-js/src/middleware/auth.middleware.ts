import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    
    const url = req.originalUrl.split('?')[0];
    
    
    if (
      url === '/auth/login' ||
      url === '/auth/forgot-password' ||
      url === '/auth/reset-password' ||
      url.startsWith('/public')
    ) {
      console.log(`Public endpoint, JWT kontrolü yapılmıyor: ${url}`);
      return next();
    }
    
    
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('JWT token missing');
    }
    
    const token = authHeader.split(' ')[1];
    let payload: any;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err) {
      throw new UnauthorizedException('Invalid JWT token');
    }

    const { userId, username, email, companyId, role: roleName } = payload;
    if (!userId) {
      throw new UnauthorizedException('Invalid JWT payload');
    }
    
    console.log(`JWT payload: userId=${userId}, role=${roleName}, companyId=${companyId}`);

    
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    
    const roleId = user.role?.id;
    if (!roleId) {
      throw new UnauthorizedException('User has no role');
    }
    
    
    const cacheKey = `role:${roleId}`;
    let userRole: Role | null = null;
    
    const cachedRole = await redis.get(cacheKey);
    if (cachedRole) {
      try {
        userRole = JSON.parse(cachedRole);
        console.log(`Role from cache: ${userRole?.role}`);
      } catch (error) {
        console.error('Cache parse error:', error);
      }
    }
    
    if (!userRole) {
      
      userRole = await this.roleRepo.findOne({ where: { id: roleId } });
      if (!userRole) {
        throw new UnauthorizedException('Role not found');
      }
      
      
      await redis.set(cacheKey, JSON.stringify(userRole), 'EX', 3600);
      console.log(`Role from DB: ${userRole.role}`);
    }
    
    
    const isAdmin = userRole.role === 'System Admin';
    
    (req as any).user = { 
      id: userId, 
      username, 
      email, 
      companyId, 
      role: userRole.role,
      permissions: {
        can_add_company: isAdmin || userRole.can_add_company === true,
        can_add_user: isAdmin || userRole.can_add_user === true,
        can_assign_device: isAdmin || userRole.can_assign_device === true, 
        can_view_data: isAdmin || userRole.can_view_data === true,
        can_view_log: isAdmin || userRole.can_view_log === true,
        can_manage_iot: isAdmin || userRole.can_manage_iot === true
      }
    };
    
    next();
  }
} 