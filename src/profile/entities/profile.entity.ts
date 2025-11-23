// src/profile/entities/profile.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { randomUUID } from 'crypto';

@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ unique: true, nullable: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  coverImage?: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  customLinks: { title: string; url: string }[];

  @Column({ type: 'jsonb', default: {} })
  theme: {
    primary?: string;
    background?: string;
    gradient?: boolean;
  };

  @Column({ default: false })
  isPremium: boolean;

  @Column({ default: false })
  allowTips: boolean;

  @Column({ type: 'decimal', default: 0 })
  tipBalance: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => UserEntity, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ name: 'userId' })
  userId: number;

  @ManyToMany(() => ProfileEntity, (profile) => profile.followers)
  following: ProfileEntity[];

  @ManyToMany(() => ProfileEntity, (profile) => profile.following)
  followers: ProfileEntity[];

  @BeforeInsert()
  generateUsernameAndSlug() {
    if (!this.username) {
      const base = `${this.firstName || ''}${this.lastName || ''}`.trim();
      this.username = base
        ? base.toLowerCase().replace(/\s+/g, '_')
        : `user_${randomUUID().slice(0, 8)}`;
    }
    this.slug = this.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  }
}
