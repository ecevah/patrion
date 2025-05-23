import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../entities/company.entity';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async create(dto: CreateCompanyDto, userId: number) {
    const company = this.companyRepo.create({
      ...dto,
      create_by: { id: userId } as any,
      update_by: { id: userId } as any,
    });
    return this.companyRepo.save(company);
  }

  async findAll() {
    return this.companyRepo.find();
  }

  async findOne(id: number) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: number, dto: UpdateCompanyDto, userId: number) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    Object.assign(company, dto);
    company.update_by = { id: userId } as any;
    return this.companyRepo.save(company);
  }

  async remove(id: number) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    await this.companyRepo.remove(company);
    return { message: 'Company deleted' };
  }
} 