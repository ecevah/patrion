import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  role: string;

  @Column({ type: 'boolean', default: false })
  can_add_company: boolean;

  @Column({ type: 'boolean', default: false })
  can_add_user: boolean;

  @Column({ type: 'boolean', default: false })
  can_assign_device: boolean;

  @Column({ type: 'boolean', default: false })
  can_view_data: boolean;

  @Column({ type: 'boolean', default: false })
  can_view_log: boolean;

  @Column({ type: 'boolean', default: false })
  can_manage_iot: boolean;

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