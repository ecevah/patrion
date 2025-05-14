export class UpdateRoleDto {
  role?: string;
  can_add_company?: boolean;
  can_add_user?: boolean;
  can_assign_device?: boolean;
  can_view_data?: boolean;
  can_view_log?: boolean;
  can_manage_iot?: boolean;
} 