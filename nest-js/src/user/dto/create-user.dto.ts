export class CreateUserDto {
  username: string;
  password: string;
  email: string;
  roleId: number;
  is_visible?: boolean;
  companyId?: number;
} 