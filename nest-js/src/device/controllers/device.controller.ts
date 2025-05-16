import { Controller, Post, Body, Get, Param, Patch, Delete, Req, BadRequestException, Query, UnauthorizedException } from '@nestjs/common';
import { DeviceService } from '../services/device.service';
import { CreateDeviceDto } from '../dto/create-device.dto';
import { UpdateDeviceDto } from '../dto/update-device.dto';
import { Permission } from '../../common/permission.decorator';
import { SuccessResponse, ListSuccessResponse, Pagination } from '../../common/response.dto';
import { Permissions } from '../../common/permission.decorator';

@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @Permission('can_manage_iot')
  async create(@Body() dto: CreateDeviceDto, @Req() req) {
    try {
      const isAdmin = req.user.role === 'System Admin';
      const companyId = isAdmin ? (dto.companyId ?? req.user.companyId) : req.user.companyId;
      
      if (!companyId) {
        throw new BadRequestException('Şirket ID bulunamadı. Lütfen geçerli bir şirket ID sağlayın.');
      }
      
      const device = await this.deviceService.create(dto, companyId, req.user.id);
      return new SuccessResponse('Cihaz başarıyla oluşturuldu', device);
    } catch (error) {
      console.error(`Cihaz oluşturma hatası: ${error.message}`, error);
      throw error;
    }
  }

  @Get('authorized-devices')
  @Permissions('can_assign_device', 'can_view_data')
  async getAuthorizedDevices(@Req() req, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    try {
      
      if (!req.user) {
        console.error('User object not found in request. AuthMiddleware might not be working properly.');
        throw new UnauthorizedException('Bu endpoint için giriş yapmanız gerekiyor');
      }

      const userId = req.user.id;
      if (!userId) {
        console.error('User ID not found in request user object', req.user);
        throw new UnauthorizedException('Kullanıcı bilgileri eksik, lütfen tekrar giriş yapın');
      }

      const userRole = req.user.role;
      const userPermissions = req.user.permissions || {};
      const companyId = req.user.companyId;
      
      console.log(`Authorized devices request - user: ${userId}, role: ${userRole}, company: ${companyId}`);
      console.log('User permissions:', JSON.stringify(userPermissions));
      
      const devices = await this.deviceService.getDevicesByPermission(
        userId, 
        userRole, 
        userPermissions, 
        companyId
      );
      
      return new SuccessResponse(
        'Yetkilerinize göre cihazlar başarıyla listelendi', 
        devices
      );
    } catch (error) {
      console.error(`Yetkiye göre cihazları listeleme hatası: ${error.message}`, error);
      throw error;
    }
  }

  @Get()
  @Permission('can_manage_iot')
  async getAll(@Req() req) {
    try {
      const isAdmin = req.user.role === 'System Admin';
      const devices = await this.deviceService.getAll(isAdmin ? undefined : req.user.companyId);
      return new SuccessResponse('Cihazlar başarıyla listelendi', devices);
    } catch (error) {
      console.error(`Cihazları listeleme hatası: ${error.message}`, error);
      throw error;
    }
  }

  @Get(':id')
  @Permission('can_manage_iot')
  async getById(@Param('id') id: number, @Req() req) {
    try {
      if (!id || isNaN(Number(id))) {
        throw new BadRequestException('Geçerli bir cihaz ID değeri sağlanmalıdır');
      }
      
      const isAdmin = req.user.role === 'System Admin';
      const device = await this.deviceService.getById(id, isAdmin ? undefined : req.user.companyId);
      return new SuccessResponse('Cihaz başarıyla bulundu', device);
    } catch (error) {
      console.error(`Cihaz getirme hatası (ID: ${id}): ${error.message}`, error);
      throw error;
    }
  }

  @Patch(':id')
  @Permission('can_manage_iot')
  async update(@Param('id') id: number, @Body() dto: UpdateDeviceDto, @Req() req) {
    try {
      if (!id || isNaN(Number(id))) {
        throw new BadRequestException('Geçerli bir cihaz ID değeri sağlanmalıdır');
      }
      
      const isAdmin = req.user.role === 'System Admin';
      const companyId = isAdmin ? undefined : req.user.companyId;
      const device = await this.deviceService.update(id, dto, companyId, req.user.id);
      return new SuccessResponse('Cihaz başarıyla güncellendi', device);
    } catch (error) {
      console.error(`Cihaz güncelleme hatası (ID: ${id}): ${error.message}`, error);
      throw error;
    }
  }

  @Delete(':id')
  @Permission('can_manage_iot')
  async delete(@Param('id') id: number, @Req() req) {
    try {
      if (!id || isNaN(Number(id))) {
        throw new BadRequestException('Geçerli bir cihaz ID değeri sağlanmalıdır');
      }
      
      const isAdmin = req.user.role === 'System Admin';
      const result = await this.deviceService.delete(id, isAdmin ? undefined : req.user.companyId);
      return new SuccessResponse('Cihaz başarıyla silindi', result);
    } catch (error) {
      console.error(`Cihaz silme hatası (ID: ${id}): ${error.message}`, error);
      throw error;
    }
  }

  @Get('check-mac/:mac')
  @Permissions('can_view_data')
  async checkMacAssignedToUser(@Param('mac') mac: string, @Req() req) {
    if (!mac) {
      throw new BadRequestException('MAC adresi gereklidir');
    }
    const user = req.user;
    
    const device = await this.deviceService.findDeviceByMac(mac);
    if (!device) {
      return new SuccessResponse('MAC adresi sistemde kayıtlı değil.', { assigned: false });
    }
    
    if (user.role === 'System Admin' || user.permissions.can_assign_device) {
      return new SuccessResponse('MAC adresi erişime açık', { assigned: true });
    }
    
    const userDeviceAccesses = await this.deviceService.getUserDeviceAccesses(user.id);
    const isAssigned = userDeviceAccesses.some(access =>
      access.device.mac && access.device.mac.toLowerCase() === mac.toLowerCase()
    );
    return new SuccessResponse(
      isAssigned ? 'MAC adresi size atanmış.' : 'MAC adresi size atanmamış.',
      { assigned: isAssigned }
    );
  }
} 