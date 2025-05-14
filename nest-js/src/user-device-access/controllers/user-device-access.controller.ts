import { Controller, Post, Body, Get, Param, Patch, Req } from '@nestjs/common';
import { UserDeviceAccessService } from '../services/user-device-access.service';
import { Permission } from '../../common/permission.decorator';

@Controller('user-device-access')
export class UserDeviceAccessController {
  constructor(private readonly udaService: UserDeviceAccessService) {}

  // Tek create endpointi
  @Post('create/:deviceId/:userId')
  @Permission('can_assign_device')
  async create(@Param('deviceId') deviceId: number, @Param('userId') userId: number, @Req() req) {
    return this.udaService.create(deviceId, userId, req.user.companyId, req.user);
  }

  // Tek getAll endpointi
  @Get('all')
  @Permission('can_assign_device')
  async getAll(@Req() req) {
    return this.udaService.getAll(req.user.companyId, req.user);
  }

  // Tek getById endpointi
  @Get(':id')
  @Permission('can_assign_device')
  async getById(@Param('id') id: number, @Req() req) {
    return this.udaService.getById(id, req.user.companyId, req.user);
  }

  // Tek update endpointi
  @Patch(':id/:deviceId/:userId')
  @Permission('can_assign_device')
  async update(@Param('id') id: number, @Param('deviceId') deviceId: number, @Param('userId') userId: number, @Req() req) {
    return this.udaService.update(id, deviceId, userId, req.user.companyId, req.user);
  }
} 