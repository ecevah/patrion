import { Controller, Post, Body, Get, Param, Patch, Delete, Req, ForbiddenException, Query } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Permission } from '../../common/permission.decorator';
import { SuccessResponse, ListSuccessResponse } from '../../common/response.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permission('can_add_company')
  async create(@Body() dto: CreateRoleDto, @Req() req) {
    try {
      const role = await this.roleService.create(dto, req.user);
      return new SuccessResponse('Rol başarıyla oluşturuldu', role);
    } catch (error) {
      console.error('Role create error:', error);
      throw error;
    }
  }

  @Get()
  @Permission('can_add_user')
  async findAll(@Req() req, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    console.log('Role findAll called, user:', req.user?.id);
    
    try {
      // System Admin tüm rolleri, diğer kullanıcılar sadece System Admin olmayanları görebilir
      const isSystemAdmin = req.user.role === 'System Admin';
      const result = await this.roleService.findAll(page, limit, isSystemAdmin);
      
      return new ListSuccessResponse(
        'Roller başarıyla listelendi', 
        result.pagination, 
        result.roles
      );
    } catch (error) {
      console.error('Role findAll error:', error);
      throw error;
    }
  }

  @Get(':id')
  @Permission('can_add_user')
  async findOne(@Param('id') id: number, @Req() req) {
    console.log('Role findOne called, id:', id);
    
    try {
      // System Admin tüm rolleri, diğer kullanıcılar sadece System Admin olmayanları görebilir
      const isSystemAdmin = req.user.role === 'System Admin';
      const role = await this.roleService.findOne(id, isSystemAdmin);
      
      return new SuccessResponse('Rol başarıyla bulundu', role);
    } catch (error) {
      console.error('Role findOne error:', error);
      throw error;
    }
  }

  @Patch(':id')
  @Permission('can_add_company')
  async update(@Param('id') id: number, @Body() dto: UpdateRoleDto, @Req() req) {
    try {
      // Rol ID kontrolü - sadece System Admin'in değiştirmesini istediğimiz roller için
      const role = await this.roleService.findOne(id, true);
      if (role.role === 'System Admin' && req.user.role !== 'System Admin') {
        throw new ForbiddenException({
          message: 'System Admin rolünü sadece System Admin kullanıcıları değiştirebilir',
          error: 'Permission Denied'
        });
      }
      
      const updatedRole = await this.roleService.update(id, dto, req.user);
      return new SuccessResponse('Rol başarıyla güncellendi', updatedRole);
    } catch (error) {
      console.error('Role update error:', error);
      throw error;
    }
  }

  @Delete(':id')
  @Permission('can_add_company')
  async remove(@Param('id') id: number, @Req() req) {
    try {
      // Silmeden önce rol kontrolü - System Admin rolünü silmeye çalışıyorsa engelle
      const role = await this.roleService.findOne(id, true);
      if (role.role === 'System Admin') {
        throw new ForbiddenException({
          message: 'System Admin rolü silinemez',
          error: 'Operation Not Allowed'
        });
      }
      
      await this.roleService.remove(id, req.user);
      return new SuccessResponse('Rol başarıyla silindi');
    } catch (error) {
      console.error('Role delete error:', error);
      throw error;
    }
  }
} 