import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  mqtt_topic: string;

  @Column({ unique: true })
  mac: string;

  @CreateDateColumn()
  create_at: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'create_by' })
  create_by: User;

  @UpdateDateColumn()
  update_at: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'update_by' })
  update_by: User;
} 