import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Pagination } from '../../common/response.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async create(dto: CreateRoleDto, user: any) {
    const role = this.roleRepo.create({ 
      ...dto, 
      create_by: { id: user.id } as any,
      update_by: { id: user.id } as any
    });
    return this.roleRepo.save(role);
  }

  async findAll(page: number = 1, limit: number = 10, isSystemAdmin: boolean = false) {
    const skipCount = (page - 1) * limit;
    
    
    const queryBuilder = this.roleRepo.createQueryBuilder('role')
      .leftJoinAndSelect('role.create_by', 'create_by')
      .leftJoinAndSelect('role.update_by', 'update_by')
      .skip(skipCount)
      .take(limit)
      .orderBy('role.id', 'ASC');
    
    
    if (!isSystemAdmin) {
      queryBuilder.where('role.role != :systemAdminRole', { systemAdminRole: 'System Admin' });
    }
    
    const [roles, total] = await queryBuilder.getManyAndCount();
    
    const pagination: Pagination = {
      current_page: page,
      total_page: Math.ceil(total / limit),
      total_item: total,
      limit: limit
    };
    
    return { roles, pagination };
  }

  async findOne(id: number, isSystemAdmin: boolean = false) {
    
    const role = await this.roleRepo.findOne({ 
      where: { id },
      relations: ['create_by', 'update_by'] 
    });
    
    if (!role) throw new NotFoundException('Role not found');
    
    
    if (!isSystemAdmin && role.role === 'System Admin') {
      throw new ForbiddenException({
        message: 'System Admin rolünü görüntüleme yetkiniz yok',
        error: 'Permission Denied'
      });
    }
    
    return role;
  }

  async update(id: number, dto: UpdateRoleDto, user: any) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    
    
    if (role.role === 'System Admin' && dto.role && dto.role !== 'System Admin') {
      throw new ForbiddenException({
        message: 'System Admin rolünün adı değiştirilemez',
        error: 'Operation Not Allowed'
      });
    }
    
    Object.assign(role, dto);
    role.update_by = { id: user.id } as any;
    return this.roleRepo.save(role);
  }

  async remove(id: number, user: any) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    
    
    if (role.role === 'System Admin') {
      throw new ForbiddenException({
        message: 'System Admin rolü silinemez',
        error: 'Operation Not Allowed'
      });
    }
    
    
    
    await this.roleRepo.remove(role);
    return { id, success: true };
  }
} 