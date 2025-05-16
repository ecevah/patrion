import { Controller, Post, Body, Get, Param, Patch, Req, Delete } from '@nestjs/common';
import { UserDeviceAccessService } from '../services/user-device-access.service';
import { Permission } from '../../common/permission.decorator';
import { SuccessResponse, EmptySuccessResponse } from '../../common/response.dto';
import { UpdateUserDeviceAccessDto } from '../dto/update-user-device-access.dto';

@Controller('user-device-access')
export class UserDeviceAccessController {
  constructor(private readonly udaService: UserDeviceAccessService) {}

  
  @Post('create/:deviceId/:userId')
  @Permission('can_assign_device')
  async create(@Param('deviceId') deviceId: number, @Param('userId') userId: number, @Req() req) {
    const access = await this.udaService.create(deviceId, userId, req.user.companyId, req.user);
    return new SuccessResponse('Kullanıcı cihaz erişimi başarıyla oluşturuldu', access);
  }

  
  @Get('all')
  @Permission('can_assign_device')
  async getAll(@Req() req) {
    const accesses = await this.udaService.getAll(req.user.companyId, req.user);
    return new SuccessResponse('Kullanıcı cihaz erişimleri başarıyla listelendi', accesses);
  }

  
  @Get('user/:userId')
  @Permission('can_assign_device')
  async getByUserId(@Param('userId') userId: number, @Req() req) {
    const accesses = await this.udaService.getByUserId(userId, req.user.companyId, req.user);
    return new SuccessResponse(`${userId} ID'li kullanıcı için cihaz erişimleri listelendi`, accesses);
  }

  
  @Get(':id')
  @Permission('can_assign_device')
  async getById(@Param('id') id: number, @Req() req) {
    const access = await this.udaService.getById(id, req.user.companyId, req.user);
    return new SuccessResponse('Kullanıcı cihaz erişimi başarıyla bulundu', access);
  }

  
  @Patch(':id')
  @Permission('can_assign_device')
  async update(@Param('id') id: number, @Body() dto: UpdateUserDeviceAccessDto, @Req() req) {
    const access = await this.udaService.update(id, dto, req.user.companyId, req.user);
    return new SuccessResponse('Kullanıcı cihaz erişimi başarıyla güncellendi', access);
  }

  
  @Delete(':id')
  @Permission('can_assign_device')
  async delete(@Param('id') id: number, @Req() req) {
    await this.udaService.delete(id, req.user.companyId, req.user);
    return new EmptySuccessResponse('Kullanıcı cihaz erişimi başarıyla silindi');
  }
} 