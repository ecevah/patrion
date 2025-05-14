import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../../entities/device.entity';
import { Company } from '../../entities/company.entity';
import { User } from '../../entities/user.entity';
import { UserDeviceAccess } from '../../entities/user-device-access.entity';
import { CreateDeviceDto } from '../dto/create-device.dto';
import { UpdateDeviceDto } from '../dto/update-device.dto';
import { ILike } from 'typeorm';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserDeviceAccess)
    private readonly userDeviceAccessRepo: Repository<UserDeviceAccess>,
  ) {}

  async create(dto: CreateDeviceDto, companyId: number, userId: number) {
    // Şirket kontrolü
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException(`${companyId} ID'li şirket bulunamadı`);
    }
    
    // Kullanıcı kontrolü
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`${userId} ID'li kullanıcı bulunamadı`);
    }
    
    try {
      // Cihaz oluşturma
      const device = this.deviceRepo.create({
        name: dto.name,
        mqtt_topic: dto.mqtt_topic,
        mac: dto.mac,
        company,
        create_by: user,
        update_by: user,
      });
      
      return await this.deviceRepo.save(device);
    } catch (error) {
      // Unique constraint hatası kontrolü
      if (error.code === '23505') { // PostgreSQL unique constraint error code
        if (error.detail.includes('name')) {
          throw new BadRequestException(`"${dto.name}" adında bir cihaz zaten mevcut. Lütfen farklı bir isim kullanın.`);
        } else if (error.detail.includes('mac')) {
          throw new BadRequestException(`"${dto.mac}" MAC adresine sahip bir cihaz zaten mevcut.`);
        } else if (error.detail.includes('mqtt_topic')) {
          throw new BadRequestException(`"${dto.mqtt_topic}" MQTT konusuna sahip bir cihaz zaten mevcut.`);
        }
      }
      throw error;
    }
  }

  async getAll(companyId?: number) {
    try {
      if (companyId) {
        // Önce şirket var mı kontrol et
        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company) {
          throw new NotFoundException(`${companyId} ID'li şirket bulunamadı`);
        }
        
        return this.deviceRepo.find({ 
          where: { company: { id: companyId } }, 
          relations: ['company', 'create_by', 'update_by'] 
        });
      }
      
      return this.deviceRepo.find({ 
        relations: ['company', 'create_by', 'update_by'] 
      });
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        console.error('Cihazları getirme hatası:', error);
      }
      throw error;
    }
  }

  async getById(id: number, companyId?: number) {
    try {
      let device: Device | null = null;
      
      if (companyId) {
        // Önce şirket var mı kontrol et
        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company) {
          throw new NotFoundException(`${companyId} ID'li şirket bulunamadı`);
        }
        
        device = await this.deviceRepo.findOne({ 
          where: { id, company: { id: companyId } }, 
          relations: ['company', 'create_by', 'update_by'] 
        });
        
        if (!device) {
          throw new NotFoundException(`${id} ID'li cihaz bu şirkette bulunamadı`);
        }
      } else {
        device = await this.deviceRepo.findOne({ 
          where: { id }, 
          relations: ['company', 'create_by', 'update_by'] 
        });
        
        if (!device) {
          throw new NotFoundException(`${id} ID'li cihaz bulunamadı`);
        }
      }
      
      return device;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        console.error(`${id} ID'li cihazı getirme hatası:`, error);
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateDeviceDto, companyId: number, userId: number) {
    try {
      // Kullanıcı kontrolü
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`${userId} ID'li kullanıcı bulunamadı`);
      }
      
      // Cihaz kontrolü
      let device = await this.deviceRepo.findOne({ 
        where: { id }, 
        relations: ['company', 'create_by', 'update_by'] 
      });
      
      if (!device) {
        throw new NotFoundException(`${id} ID'li cihaz bulunamadı`);
      }
      
      // Şirket bazlı yetki kontrolü
      if (companyId && device.company.id !== companyId) {
        throw new NotFoundException(`${id} ID'li cihaz bu şirkette bulunamadı`);
      }
      
      // Şirket değişikliği kontrolü
      if (dto.companyId) {
        const company = await this.companyRepo.findOne({ where: { id: dto.companyId } });
        if (!company) {
          throw new NotFoundException(`${dto.companyId} ID'li şirket bulunamadı`);
        }
        device.company = company;
      }
      
      // Cihaz güncelleme
      Object.assign(device, {
        name: dto.name !== undefined ? dto.name : device.name,
        mqtt_topic: dto.mqtt_topic !== undefined ? dto.mqtt_topic : device.mqtt_topic,
        mac: dto.mac !== undefined ? dto.mac : device.mac,
        update_by: user
      });
      
      return await this.deviceRepo.save(device);
    } catch (error) {
      // Unique constraint hatası kontrolü
      if (error.code === '23505') { // PostgreSQL unique constraint error code
        if (error.detail.includes('name')) {
          throw new BadRequestException(`"${dto.name}" adında bir cihaz zaten mevcut. Lütfen farklı bir isim kullanın.`);
        } else if (error.detail.includes('mac')) {
          throw new BadRequestException(`"${dto.mac}" MAC adresine sahip bir cihaz zaten mevcut.`);
        } else if (error.detail.includes('mqtt_topic')) {
          throw new BadRequestException(`"${dto.mqtt_topic}" MQTT konusuna sahip bir cihaz zaten mevcut.`);
        }
      }
      
      if (!(error instanceof NotFoundException || error instanceof BadRequestException)) {
        console.error(`${id} ID'li cihazı güncelleme hatası:`, error);
      }
      throw error;
    }
  }

  async delete(id: number, companyId?: number) {
    try {
      let device: Device | null = null;
      
      if (companyId) {
        // Önce şirket var mı kontrol et
        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company) {
          throw new NotFoundException(`${companyId} ID'li şirket bulunamadı`);
        }
        
        device = await this.deviceRepo.findOne({ 
          where: { id, company: { id: companyId } },
          relations: ['company'] 
        });
        
        if (!device) {
          throw new NotFoundException(`${id} ID'li cihaz bu şirkette bulunamadı`);
        }
      } else {
        device = await this.deviceRepo.findOne({ 
          where: { id },
          relations: ['company'] 
        });
        
        if (!device) {
          throw new NotFoundException(`${id} ID'li cihaz bulunamadı`);
        }
      }
      
      await this.deviceRepo.remove(device);
      return { message: 'Cihaz başarıyla silindi' };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        console.error(`${id} ID'li cihazı silme hatası:`, error);
      }
      throw error;
    }
  }

  /**
   * Kullanıcı yetkilerine göre cihazları getir
   * 1. System Admin ise tüm cihazları görür
   * 2. can_assign_device yetkisi varsa şirketindeki cihazları görür
   * 3. can_view_data yetkisi varsa sadece kendisine atanmış cihazları görür
   * 4. Hiçbir yetki yoksa erişim reddedilir
   */
  async getDevicesByPermission(userId: number, userRole: string, userPermissions: any, companyId: number) {
    try {
      // Parametrelerin varlığını kontrol et
      if (!userId) {
        throw new BadRequestException('Kullanıcı ID parametresi eksik');
      }

      // 1. System Admin için tüm cihazları getir
      if (userRole === 'System Admin') {
        console.log(`System Admin (${userId}) için tüm cihazlar getiriliyor`);
        const devices = await this.deviceRepo.find({
          relations: ['company', 'create_by', 'update_by']
        });
        return devices;
      }
      
      // Güvenlik kontrolleri
      userPermissions = userPermissions || {};
      
      // 2. can_assign_device yetkisi için şirket cihazlarını getir
      if (userPermissions.can_assign_device === true) {
        if (!companyId) {
          throw new BadRequestException('Şirket ID bulunamadı');
        }
        
        console.log(`can_assign_device yetkisi olan kullanıcı (${userId}) için şirket (${companyId}) cihazları getiriliyor`);
        
        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company) {
          throw new NotFoundException(`${companyId} ID'li şirket bulunamadı`);
        }
        
        const devices = await this.deviceRepo.find({
          where: { company: { id: companyId } },
          relations: ['company', 'create_by', 'update_by']
        });
        
        return devices;
      }
      
      // 3. can_view_data yetkisi için kullanıcıya atanmış cihazları getir
      if (userPermissions.can_view_data === true) {
        console.log(`can_view_data yetkisi olan kullanıcı (${userId}) için atanmış cihazlar getiriliyor`);
        
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
          throw new NotFoundException(`${userId} ID'li kullanıcı bulunamadı`);
        }
        
        // Kullanıcıya atanmış cihazları bul
        const userDeviceAccesses = await this.userDeviceAccessRepo.find({
          where: { user: { id: userId } },
          relations: ['device', 'device.company', 'device.create_by', 'device.update_by']
        });
        
        if (userDeviceAccesses.length === 0) {
          console.log(`Kullanıcı (${userId}) için atanmış cihaz bulunamadı`);
          return []; // Kullanıcıya atanmış cihaz yok, boş dizi dön
        }
        
        // Cihazları çıkar
        const devices = userDeviceAccesses.map(access => access.device);
        return devices;
      }
      
      // 4. Hiçbir yetki yoksa erişim reddet
      console.log(`Kullanıcının (${userId}) yeterli yetkisi yok. Yetkiler:`, userPermissions);
      throw new ForbiddenException({
        message: 'Bu işlemi gerçekleştirmek için gerekli yetkilere sahip değilsiniz',
        error: 'Permission Denied',
        required: ['can_assign_device', 'can_view_data']
      });
    } catch (error) {
      if (!(error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException)) {
        console.error(`Kullanıcı yetkilerine göre cihazları getirme hatası (kullanıcı: ${userId}):`, error);
      }
      throw error;
    }
  }

  async getUserDeviceAccesses(userId: number) {
    return this.userDeviceAccessRepo.find({
      where: { user: { id: userId } },
      relations: ['device']
    });
  }

  async findDeviceByMac(mac: string) {
    return this.deviceRepo.findOne({
      where: { mac: ILike(mac) },
    });
  }
} 