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

  // Tek create fonksiyonu (role JWT'den alınacak)
  async create(deviceId: number, userId: number, companyId: number, reqUser: any) {
    // Admin ise companyId parametrelerden, değilse JWT'den
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

  // Tek getAll fonksiyonu
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

  // Tek getById fonksiyonu
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

  // Tek update fonksiyonu
  async update(id: number, deviceId: number, userId: number, companyId: number, reqUser: any) {
    let uda;
    if (reqUser.role === 'System Admin') {
      uda = await this.udaRepo.findOne({ where: { id } });
      if (!uda) throw new NotFoundException('UserDeviceAccess not found');
      const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!device) throw new NotFoundException('Device not found');
      if (!user) throw new NotFoundException('User not found');
      uda.device = device;
      uda.user = user;
    } else {
      uda = await this.udaRepo.createQueryBuilder('uda')
        .leftJoinAndSelect('uda.user', 'user')
        .leftJoinAndSelect('uda.device', 'device')
        .leftJoin('device.company', 'company')
        .where('uda.id = :id', { id })
        .andWhere('company.id = :companyId', { companyId })
        .getOne();
      if (!uda) throw new NotFoundException('UserDeviceAccess not found in this company');
      const device = await this.deviceRepo.findOne({ where: { id: deviceId, company: { id: companyId } } });
      const user = await this.userRepo.findOne({ where: { id: userId, company: { id: companyId } } });
      if (!device) throw new NotFoundException('Device not found in this company');
      if (!user) throw new NotFoundException('User not found in this company');
      uda.device = device;
      uda.user = user;
    }
    uda.update_by = { id: reqUser.id } as User;
    return this.udaRepo.save(uda);
  }
} 