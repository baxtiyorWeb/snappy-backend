// src/post/entities/post.entity.ts
import { Comment } from 'src/comment/entities/comment.entity';
import { UserEntity } from './../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { PostLike } from './post-like.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @OneToMany(() => Comment, (comment) => comment.post) // Yangi
  commentsEntity: Comment[];

  @OneToMany(() => PostLike, (postLike) => postLike.post) // Yangi
  postLikes: PostLike[];
  @Column({ type: 'text' })
  videoUrl: string;

  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'text' })
  caption: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'text', nullable: true })
  hashtags: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 10, default: 'HD' })
  quality: string;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  comments: number;

  @Column({ default: 0 })
  shares: number;

  @Column({ default: 0 })
  views: number;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: true })
  allowComments: boolean;

  @Column({ default: true })
  allowLikes: boolean;

  @Column({ default: true })
  shareToFeed: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  duration: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fileSize: string;

  @Column({ type: 'float', default: 1.0 })
  brightness: number;

  @Column({ type: 'float', default: 1.0 })
  volume: number;

  @Column({ type: 'varchar', length: 50, default: 'normal' })
  filter: string;

  @Column({ default: false })
  enableWatermark: boolean;

  @Column({ default: false })
  enableNotifications: boolean;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
