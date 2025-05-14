import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Company } from './company.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ unique: true })
  email: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ default: true })
  is_visible: boolean;

  @CreateDateColumn()
  create_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'create_by' })
  create_by: User;

  @UpdateDateColumn()
  update_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'update_by' })
  update_by: User;
} 