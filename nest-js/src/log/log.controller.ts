import { Controller, Get, Query, Req, Param } from '@nestjs/common';
import { LogService } from './log.service';
import { Permission } from '../common/permission.decorator';
import { SuccessResponse, ListSuccessResponse } from '../common/response.dto';

@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  // Tüm logları getir (system admin tümünü, can_view_log ise sadece kendi şirketini)
  @Get('all')
  @Permission('can_view_log')
  async getAll(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const isSystemAdmin = req.user.role === 'System Admin';
    const companyId = req.user.companyId;
    const result = await this.logService.getAll(page, limit, isSystemAdmin, companyId);
    return new ListSuccessResponse('Log kayıtları başarıyla listelendi', result.pagination, result.logs);
  }

  // Belirli bir kullanıcıya ait logları getir
  @Get('user/:userId')
  @Permission('can_view_log')
  async getByUserId(
    @Param('userId') userId: number,
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const isSystemAdmin = req.user.role === 'System Admin';
    const companyId = req.user.companyId;
    const result = await this.logService.getByUserId(userId, page, limit, isSystemAdmin, companyId);
    return new ListSuccessResponse('Kullanıcı log kayıtları başarıyla listelendi', result.pagination, result.logs);
  }
} 