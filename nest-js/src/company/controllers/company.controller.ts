import { Controller, Post, Body, Get, Param, Patch, Delete, Req } from '@nestjs/common';
import { CompanyService } from '../services/company.service';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { Permission } from '../../common/permission.decorator';
import { SuccessResponse, EmptySuccessResponse } from '../../common/response.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Permission('can_add_company')
  async create(@Body() dto: CreateCompanyDto, @Req() req) {
    const company = await this.companyService.create(dto, req.user.id);
    return new SuccessResponse('Şirket başarıyla oluşturuldu', company);
  }

  @Get()
  @Permission('can_add_company')
  async findAll(@Req() req) {
    const companies = await this.companyService.findAll();
    return new SuccessResponse('Şirketler başarıyla listelendi', companies);
  }

  @Get(':id')
  @Permission('can_add_company')
  async findOne(@Param('id') id: number, @Req() req) {
    const company = await this.companyService.findOne(id);
    return new SuccessResponse('Şirket başarıyla bulundu', company);
  }

  @Patch(':id')
  @Permission('can_add_company')
  async update(@Param('id') id: number, @Body() dto: UpdateCompanyDto, @Req() req) {
    const company = await this.companyService.update(id, dto, req.user.id);
    return new SuccessResponse('Şirket başarıyla güncellendi', company);
  }

  @Delete(':id')
  @Permission('can_add_company')
  async remove(@Param('id') id: number, @Req() req) {
    await this.companyService.remove(id);
    return new EmptySuccessResponse('Şirket başarıyla silindi');
  }

  @Get('me')
  async getMyCompany(@Req() req) {
    const company = await this.companyService.findOne(req.user.companyId);
    return new SuccessResponse('Şirket başarıyla bulundu', company);
  }
} 