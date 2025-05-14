import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import * as jwt from 'jsonwebtoken';
import { SuccessResponse, ErrorResponse } from '../../common/response.dto';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

@Injectable()
export class UserAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private readonly redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  async login(dto: LoginDto) {
    // Rate limiting: Son 5 dakikada 5 başarısız deneme varsa engelle
    const failKey = `login_fail:${dto.email}`;
    const failCount = parseInt(await this.redis.get(failKey) || '0', 10);
    if (failCount >= 5) {
      return new ErrorResponse('Çok fazla başarısız giriş denemesi. Lütfen 5 dakika sonra tekrar deneyin.', 'Too many login attempts');
    }

    const userWithRole = await this.userRepo.findOne({ 
      where: { email: dto.email }, 
      relations: ['role', 'company'] 
    });
    
    if (!userWithRole) {
      await this.redis.multi().incr(failKey).expire(failKey, 300).exec();
      return new ErrorResponse('Giriş başarısız', 'Invalid credentials');
    }
    
    // Şifre kontrol bcrypt ile
    const isPasswordValid = await bcrypt.compare(dto.password, userWithRole.password);
    if (!isPasswordValid) {
      await this.redis.multi().incr(failKey).expire(failKey, 300).exec();
      return new ErrorResponse('Giriş başarısız', 'Invalid credentials');
    }
    // Başarılı girişte sayacı sıfırla
    await this.redis.del(failKey);
    
    // JWT oluştur
    const token = jwt.sign({
      userId: userWithRole.id,
      username: userWithRole.username,
      email: userWithRole.email,
      companyId: userWithRole.company ? userWithRole.company.id : null,
      role: userWithRole.role ? userWithRole.role.role : null
    }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    return new SuccessResponse('Giriş başarılı', {
      token,
      username: userWithRole.username,
      email: userWithRole.email,
      role: userWithRole.role ? userWithRole.role.role : null,
      is_visible: userWithRole.is_visible
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      return new ErrorResponse('Kullanıcı bulunamadı', 'User not found');
    }
    // Reset token oluştur
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    // Burada email gönderme işlemi yapılacak (şimdilik console.log)
    console.log(`Şifre sıfırlama tokeni: ${resetToken}`);
    // TODO: Gerçek email gönderimi entegre edilecek
    return new SuccessResponse('Şifre sıfırlama maili gönderildi.');
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    try {
      payload = jwt.verify(dto.token, process.env.JWT_SECRET || 'secret');
    } catch (err) {
      return new ErrorResponse('Token geçersiz veya süresi dolmuş', 'Invalid or expired token');
    }
    const user = await this.userRepo.findOne({ where: { id: payload.userId } });
    if (!user) {
      return new ErrorResponse('Kullanıcı bulunamadı', 'User not found');
    }
    // Şifre politikası kontrolü
    const password = dto.newPassword;
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordPolicy.test(password)) {
      return new ErrorResponse('Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter içermelidir.', 'Password policy error');
    }
    // Şifreyi hash'leyerek kaydet
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);
    return new SuccessResponse('Şifre başarıyla güncellendi.');
  }
} 