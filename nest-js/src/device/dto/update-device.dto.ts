export class UpdateDeviceDto {
  name?: string;
  mqtt_topic?: string;
  mac?: string;
  companyId?: number; // Only for admin
} 