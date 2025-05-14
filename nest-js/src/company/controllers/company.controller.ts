import { Controller, Post, Body, Get, Param, Patch, Delete, Req } from '@nestjs/common';
import { CompanyService } from '../services/company.service';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { Permission } from '../../common/permission.decorator';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Permission('can_add_company')
  async create(@Body() dto: CreateCompanyDto, @Req() req) {
    // Sadece System Admin middleware ile kontrol ediliyor
    return this.companyService.create(dto);
  }

  @Get()
  @Permission('can_add_company')
  async findAll(@Req() req) {
    return this.companyService.findAll();
  }

  @Get(':id')
  @Permission('can_add_company')
  async findOne(@Param('id') id: number, @Req() req) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @Permission('can_add_company')
  async update(@Param('id') id: number, @Body() dto: UpdateCompanyDto, @Req() req) {
    return this.companyService.update(id, dto);
  }

  @Delete(':id')
  @Permission('can_add_company')
  async remove(@Param('id') id: number, @Req() req) {
    return this.companyService.remove(id);
  }

  @Get('me')
  async getMyCompany(@Req() req) {
    return this.companyService.findOne(req.user.companyId);
  }
} 