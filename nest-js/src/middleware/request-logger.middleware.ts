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
    const details = JSON.stringify({
      params: req.params,
      query: req.query,
      body: req.body,
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