import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDeviceAccess } from '../../entities/user-device-access.entity';
import { User } from '../../entities/user.entity';
import { Device } from '../../entities/device.entity';
import { CreateUserDeviceAccessDto } from '../dto/create-user-device-access.dto';
import { UpdateUserDeviceAccessDto } from '../dto/update-user-device-access.dto';

@Injectable()
export class UserDeviceAccessService {
  constructor(
    @InjectRepository(UserDeviceAccess)
    private readonly udaRepo: Repository<UserDeviceAccess>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  
  async create(deviceId: number, userId: number, companyId: number, reqUser: any) {
    
    const isAdmin = reqUser.role === 'System Admin';
    let device, user;
    if (isAdmin) {
      device = await this.deviceRepo.findOne({ where: { id: deviceId }, relations: ['company'] });
      user = await this.userRepo.findOne({ where: { id: userId } });
    } else {
      device = await this.deviceRepo.findOne({ where: { id: deviceId, company: { id: companyId } }, relations: ['company'] });
      user = await this.userRepo.findOne({ where: { id: userId, company: { id: companyId } } });
    }
    if (!device) throw new NotFoundException('Device not found');
    if (!user) throw new NotFoundException('User not found');
    const uda = this.udaRepo.create({ user, device, create_by: { id: reqUser.id } as User });
    return this.udaRepo.save(uda);
  }

  
  async getAll(companyId: number, reqUser: any) {
    if (reqUser.role === 'System Admin') {
      return this.udaRepo.find({ relations: ['user', 'device'] });
    } else {
      return this.udaRepo.createQueryBuilder('uda')
        .leftJoinAndSelect('uda.user', 'user')
        .leftJoinAndSelect('uda.device', 'device')
        .leftJoin('device.company', 'company')
        .where('company.id = :companyId', { companyId })
        .getMany();
    }
  }

  
  async getById(id: number, companyId: number, reqUser: any) {
    if (reqUser.role === 'System Admin') {
      const uda = await this.udaRepo.findOne({ where: { id }, relations: ['user', 'device'] });
      if (!uda) throw new NotFoundException('UserDeviceAccess not found');
      return uda;
    } else {
      const uda = await this.udaRepo.createQueryBuilder('uda')
        .leftJoinAndSelect('uda.user', 'user')
        .leftJoinAndSelect('uda.device', 'device')
        .leftJoin('device.company', 'company')
        .where('uda.id = :id', { id })
        .andWhere('company.id = :companyId', { companyId })
        .getOne();
      if (!uda) throw new NotFoundException('UserDeviceAccess not found in this company');
      return uda;
    }
  }

  
  async update(id: number, dto: UpdateUserDeviceAccessDto, companyId: number, reqUser: any) {
    let uda;
    if (reqUser.role === 'System Admin') {
      uda = await this.udaRepo.findOne({ where: { id }, relations: ['user', 'device'] });
      if (!uda) throw new NotFoundException('UserDeviceAccess not found');
      
      if (dto.deviceId) {
        const device = await this.deviceRepo.findOne({ where: { id: dto.deviceId } });
        if (!device) throw new NotFoundException('Device not found');
        uda.device = device;
      }
      
      if (dto.userId) {
        const user = await this.userRepo.findOne({ where: { id: dto.userId } });
        if (!user) throw new NotFoundException('User not found');
        uda.user = user;
      }
    } else {
      uda = await this.udaRepo.createQueryBuilder('uda')
        .leftJoinAndSelect('uda.user', 'user')
        .leftJoinAndSelect('uda.device', 'device')
        .leftJoin('device.company', 'company')
        .where('uda.id = :id', { id })
        .andWhere('company.id = :companyId', { companyId })
        .getOne();
      if (!uda) throw new NotFoundException('UserDeviceAccess not found in this company');
      
      if (dto.deviceId) {
        const device = await this.deviceRepo.findOne({ where: { id: dto.deviceId, company: { id: companyId } } });
        if (!device) throw new NotFoundException('Device not found in this company');
        uda.device = device;
      }
      
      if (dto.userId) {
        const user = await this.userRepo.findOne({ where: { id: dto.userId, company: { id: companyId } } });
        if (!user) throw new NotFoundException('User not found in this company');
        uda.user = user;
      }
    }
    
    uda.update_by = { id: reqUser.id } as User;
    return this.udaRepo.save(uda);
  }

  
  async delete(id: number, companyId: number, reqUser: any) {
    let uda;
    if (reqUser.role === 'System Admin') {
      uda = await this.udaRepo.findOne({ where: { id }, relations: ['user', 'device'] });
      if (!uda) throw new NotFoundException('UserDeviceAccess not found');
    } else {
      uda = await this.udaRepo.createQueryBuilder('uda')
        .leftJoinAndSelect('uda.user', 'user')
        .leftJoinAndSelect('uda.device', 'device')
        .leftJoin('device.company', 'company')
        .where('uda.id = :id', { id })
        .andWhere('company.id = :companyId', { companyId })
        .getOne();
      if (!uda) throw new NotFoundException('UserDeviceAccess not found in this company');
    }
    
    await this.udaRepo.remove(uda);
    return { message: 'Kullanıcı cihaz erişimi başarıyla silindi' };
  }

  
  async getByUserId(userId: number, companyId: number, reqUser: any) {
    if (reqUser.role === 'System Admin') {
      const accesses = await this.udaRepo.find({ 
        where: { user: { id: userId } },
        relations: ['user', 'device', 'device.company']
      });
      
      if (accesses.length === 0) {
        throw new NotFoundException(`${userId} ID'li kullanıcı için cihaz erişimi bulunamadı`);
      }
      
      return accesses;
    } else {
      
      const user = await this.userRepo.findOne({ 
        where: { id: userId, company: { id: companyId } }
      });
      
      if (!user) {
        throw new NotFoundException(`${userId} ID'li kullanıcı bu şirkette bulunamadı`);
      }
      
      const accesses = await this.udaRepo.createQueryBuilder('uda')
        .leftJoinAndSelect('uda.user', 'user')
        .leftJoinAndSelect('uda.device', 'device')
        .leftJoinAndSelect('device.company', 'company')
        .where('user.id = :userId', { userId })
        .andWhere('company.id = :companyId', { companyId })
        .getMany();
      
      if (accesses.length === 0) {
        throw new NotFoundException(`${userId} ID'li kullanıcı için cihaz erişimi bulunamadı`);
      }
      
      return accesses;
    }
  }
} 