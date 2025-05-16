import { Controller, Post, Body, Get, Param, Patch, Req, NotFoundException, Query } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { Permission } from '../../common/permission.decorator';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SuccessResponse, ListSuccessResponse } from '../../common/response.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  
  @Post('create')
  @Permission('can_add_user')
  async create(@Body() dto: CreateUserDto, @Req() req) {
    
    const companyId = req.user.role === 'System Admin' ? dto.companyId : req.user.companyId;
    const user = await this.userService.create(dto, companyId, req.user.role === 'System Admin', req.user);
    
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return new SuccessResponse('Kullanıcı başarıyla oluşturuldu', userWithoutPassword);
    }
    
    return new SuccessResponse('Kullanıcı başarıyla oluşturuldu', user);
  }

  
  @Get('all')
  @Permission('can_add_user')
  async getAll(@Req() req, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    let result;
    if (req.user.role === 'System Admin') {
      
      result = await this.userService.getAllForAdmin(page, limit);
    } else {
      
      result = await this.userService.getAllByCompany(req.user.companyId, page, limit);
    }
    return new ListSuccessResponse('Kullanıcılar başarıyla listelendi', result.pagination, result.users);
  }

  
  @Get(':id')
  @Permission('can_add_user')
  async getById(@Param('id') id: number, @Req() req) {
    let user;
    if (req.user.role === 'System Admin') {
      
      user = await this.userService.getByIdForAdmin(id);
    } else {
      
      user = await this.userService.getByIdWithCompany(id, req.user.companyId);
    }
    
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return new SuccessResponse('Kullanıcı başarıyla bulundu', userWithoutPassword);
    }
    
    return new SuccessResponse('Kullanıcı başarıyla bulundu', user);
  }

  
  @Patch(':id')
  @Permission('can_add_user')
  async updateById(@Param('id') id: number, @Body() dto: Partial<CreateUserDto>, @Req() req) {
    const user = await this.userService.updateById(id, dto, req.user);
    
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return new SuccessResponse('Kullanıcı başarıyla güncellendi', userWithoutPassword);
    }
    
    return new SuccessResponse('Kullanıcı başarıyla güncellendi', user);
  }
} 