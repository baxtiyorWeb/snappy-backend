import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ProfileEntity } from '../../profile/entities/profile.entity';
import { FollowEntity } from '../../follow/entities/follow.entity';
import { Post } from './../../post/entities/post.entity';
import { Comment } from './../../comment/entities/comment.entity'; // Yangi import
import { CommentLike } from './../../comment/entities/comment-like.entity'; // Yangi import
import { PostLike } from './../../post/entities/post-like.entity'; // Yangi import

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column('text', { array: true, default: [] })
  onesignal_player_ids: string[];

  @OneToOne(() => ProfileEntity, (p) => p.user, { cascade: true })
  profile: ProfileEntity;

  @OneToMany(() => FollowEntity, (follow) => follow.following)
  followers: FollowEntity[];

  @OneToMany(() => FollowEntity, (follow) => follow.follower)
  following: FollowEntity[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  // ============================================
  // COMMENT MODULI BILAN BOG'LANISHLAR
  // ============================================

  // Foydalanuvchi tomonidan yozilgan barcha kommentariyalar
  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  // Foydalanuvchi tomonidan berilgan barcha comment like'lar
  @OneToMany(() => CommentLike, (commentLike) => commentLike.user)
  commentLikes: CommentLike[];

  // Foydalanuvchi tomonidan berilgan barcha post like'lar
  @OneToMany(() => PostLike, (postLike) => postLike.user)
  postLikes: PostLike[];
}
