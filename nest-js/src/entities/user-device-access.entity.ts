import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { User } from './user.entity';
import { Device } from './device.entity';

@Entity()
export class UserDeviceAccess {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @CreateDateColumn()
  create_at: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'create_by' })
  create_by: User;

  @UpdateDateColumn()
  update_at: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'update_by' })
  update_by: User;
} 