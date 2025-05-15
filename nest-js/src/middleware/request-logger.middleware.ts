import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LogService } from '../log/log.service';
import { User } from '../entities/user.entity';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logService: LogService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // User bilgisi varsa al
    const user = (req as any).user;
    
    // Kullanıcı kimliğini kontrol et - eğer user objesi varsa kullan
    const userId = user ? user.id : null;
    const userRef = userId ? { id: userId } as User : undefined;
    
    const actionType = req.method + ' ' + req.originalUrl;
    let logBody = req.body;
    // Hassas endpointlerde body'yi maskele veya çıkar
    if (
      (req.method === 'POST' && req.originalUrl === '/auth/login') ||
      (req.method === 'POST' && req.originalUrl === '/auth/forgot-password') ||
      (req.method === 'POST' && req.originalUrl === '/auth/reset-password')
    ) {
      // Sadece email veya token gibi hassas olmayan alanları bırak
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

    // User bilgisini daha detaylı logla
    if (user) {
      console.log(`JWT user data available: userId=${userId}, role=${user.role}`);
    } else {
      console.log(`No JWT user data available for request`);
    }

    // Log entity oluştur
    await this.logService.createLog(userRef, actionType, details);
    console.log(`[LOG] ${actionType} - user: ${userRef ? userRef.id : 'anonim'} - details: ${details}`);
    next();
  }
} 