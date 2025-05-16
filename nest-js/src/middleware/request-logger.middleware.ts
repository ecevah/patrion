import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LogService } from '../log/log.service';
import { User } from '../entities/user.entity';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logService: LogService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    
    const user = (req as any).user;
    
    
    const userId = user ? user.id : null;
    const userRef = userId ? { id: userId } as User : undefined;
    
    const actionType = req.method + ' ' + req.originalUrl;
    let logBody = req.body;
    
    if (
      (req.method === 'POST' && req.originalUrl === '/auth/login') ||
      (req.method === 'POST' && req.originalUrl === '/auth/forgot-password') ||
      (req.method === 'POST' && req.originalUrl === '/auth/reset-password')
    ) {
      
      if (req.originalUrl === '/auth/login') {
        logBody = { email: req.body?.email };
      } else if (req.originalUrl === '/auth/forgot-password') {
        logBody = { email: req.body?.email };
      } else if (req.originalUrl === '/auth/reset-password') {
        logBody = { token: req.body?.token ? '[MASKED]' : undefined };
      }
    }
    const details = JSON.stringify({
      params: req.params,
      query: req.query,
      body: logBody,
    });

    
    if (user) {
      console.log(`JWT user data available: userId=${userId}, role=${user.role}`);
    } else {
      console.log(`No JWT user data available for request`);
    }

    
    await this.logService.createLog(userRef, actionType, details);
    console.log(`[LOG] ${actionType} - user: ${userRef ? userRef.id : 'anonim'} - details: ${details}`);
    next();
  }
} 