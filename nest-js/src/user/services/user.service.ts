import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from '../../entities/role.entity';
import { Company } from '../../entities/company.entity';
import * as bcrypt from 'bcrypt';
import { Pagination } from '../../common/response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async create(dto: CreateUserDto, companyId: number, isAdmin: boolean, reqUser?: any) {
    
    const password = dto.password;
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordPolicy.test(password)) {
      throw new BadRequestException('Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter içermelidir.');
    }
    
    const existingUser = await this.userRepo.findOne({ where: [{ username: dto.username }, { email: dto.email }] });
    if (existingUser) {
      throw new BadRequestException('Kullanıcı adı veya e-posta zaten kayıtlı.');
    }
    const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('Role not found');
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      username: dto.username,
      password: hashedPassword, 
      email: dto.email,
      role,
      company,
      is_visible: dto.is_visible ?? true,
      create_by: reqUser ? { id: reqUser.id } as any : null,
      update_by: reqUser ? { id: reqUser.id } as any : null
    });
    return this.userRepo.save(user);
  }

  async getAll(companyId?: number) {
    const query = this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.company', 'company');

    
    query.andWhere('role.role != :adminRole', { adminRole: 'System Admin' });
    
    if (companyId) {
      query.andWhere('company.id = :companyId', { companyId });
    }
    
    return query.getMany();
  }

  async getById(id: number, companyId?: number) {
    const query = this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.company', 'company')
      .where('user.id = :id', { id })
      .andWhere('role.role != :adminRole', { adminRole: 'System Admin' });
    
    if (companyId) {
      query.andWhere('company.id = :companyId', { companyId });
    }
    
    const user = await query.getOne();
    if (!user) throw new NotFoundException('User not found or you do not have permission to view this user');
    return user;
  }

  async getAllByCompany(companyId: number, page: number = 1, limit: number = 10) {
    const skipCount = (page - 1) * limit;
    
    const query = this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.company', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('role.role != :adminRole', { adminRole: 'System Admin' })
      .skip(skipCount)
      .take(limit)
      .orderBy('user.id', 'ASC');
    
    const [users, total] = await query.getManyAndCount();
    
    
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    const pagination: Pagination = {
      current_page: page,
      total_page: Math.ceil(total / limit),
      total_item: total,
      limit: limit
    };
    
    return { users: usersWithoutPassword, pagination };
  }

  async getByIdWithCompany(id: number, companyId: number) {
    const query = this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.company', 'company')
      .where('user.id = :id', { id })
      .andWhere('company.id = :companyId', { companyId })
      .andWhere('role.role != :adminRole', { adminRole: 'System Admin' });
    
    const user = await query.getOne();
    if (!user) throw new NotFoundException('User not found or you do not have permission to view this user');
    return user;
  }

  async updateById(id: number, dto: Partial<CreateUserDto>, reqUser?: any) {
    let user: User | null = null;
    const isAdmin = reqUser?.role === 'System Admin';
    
    
    if (isAdmin) {
      user = await this.userRepo.findOne({ 
        where: { id },
        relations: ['role', 'company']
      });
      if (!user) throw new NotFoundException('User not found');
    } else {
      
      user = await this.userRepo.findOne({ 
        where: { id, company: { id: reqUser.companyId } },
        relations: ['role', 'company']
      });
      if (!user) throw new NotFoundException('User not found in this company');
      
      
      if (user.role && user.role.role === 'System Admin') {
        throw new BadRequestException({
          message: 'System Admin kullanıcılarını güncelleme yetkiniz yok',
          error: 'Permission Denied'
        });
      }
    }
    
    
    const { password, ...restDto } = dto;
    
    Object.assign(user, restDto);
    if (reqUser) user.update_by = { id: reqUser.id } as any;
    return this.userRepo.save(user);
  }

  async updateByIdWithCompany(id: number, companyId: number, dto: Partial<CreateUserDto>, reqUser?: any) {
    
    const user = await this.userRepo.findOne({
      where: { id, company: { id: companyId } },
      relations: ['role', 'company']
    });
    
    if (!user) throw new NotFoundException('User not found in this company');
    
    
    if (user.role && user.role.role === 'System Admin') {
      throw new BadRequestException({
        message: 'System Admin kullanıcılarını güncelleme yetkiniz yok',
        error: 'Permission Denied'
      });
    }
    
    
    const { password, ...restDto } = dto;
    
    Object.assign(user, restDto);
    if (reqUser) user.update_by = { id: reqUser.id } as any;
    return this.userRepo.save(user);
  }

  
  async getAllForAdmin(page: number = 1, limit: number = 10) {
    const skipCount = (page - 1) * limit;
    
    const [users, total] = await this.userRepo.findAndCount({
      relations: ['role', 'company'],
      skip: skipCount,
      take: limit,
      order: { id: 'ASC' }
    });
    
    
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    const pagination: Pagination = {
      current_page: page,
      total_page: Math.ceil(total / limit),
      total_item: total,
      limit: limit
    };
    
    return { users: usersWithoutPassword, pagination };
  }

  
  async getByIdForAdmin(id: number) {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['role', 'company'] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
} 