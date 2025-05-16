export class CreateDeviceDto {
  name: string;
  mqtt_topic: string;
  mac: string;
  companyId?: number; 
} 