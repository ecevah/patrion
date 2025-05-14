import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

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