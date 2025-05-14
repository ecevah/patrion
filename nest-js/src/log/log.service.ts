import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Log } from '../entities/log.entity';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepo: Repository<Log>,
  ) {}

  async createLog(user: User | undefined, action_type: string, details: string) {
    const log = this.logRepo.create({
      ...(user && { user }),
      action_type,
      details,
    });
    await this.logRepo.save(log);
  }

  async getAll(page: number = 1, limit: number = 10, isSystemAdmin: boolean = false, companyId?: number) {
    const skipCount = (page - 1) * limit;
    const query = this.logRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .leftJoinAndSelect('user.company', 'company')
      .orderBy('log.id', 'DESC')
      .skip(skipCount)
      .take(limit);

    if (!isSystemAdmin && companyId) {
      query.andWhere('user.company_id = :companyId', { companyId });
    }

    const [logs, total] = await query.getManyAndCount();
    const pagination = {
      current_page: page,
      total_page: Math.ceil(total / limit),
      total_item: total,
      limit: limit
    };
    return { logs, pagination };
  }

  async getByUserId(userId: number, page: number = 1, limit: number = 10, isSystemAdmin: boolean = false, companyId?: number) {
    const skipCount = (page - 1) * limit;
    const query = this.logRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .leftJoinAndSelect('user.company', 'company')
      .where('user.id = :userId', { userId })
      .orderBy('log.id', 'DESC')
      .skip(skipCount)
      .take(limit);

    if (!isSystemAdmin && companyId) {
      query.andWhere('user.company_id = :companyId', { companyId });
    }

    const [logs, total] = await query.getManyAndCount();
    const pagination = {
      current_page: page,
      total_page: Math.ceil(total / limit),
      total_item: total,
      limit: limit
    };
    return { logs, pagination };
  }
} 