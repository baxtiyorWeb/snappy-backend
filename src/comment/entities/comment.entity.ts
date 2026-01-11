import { UserEntity } from './../../users/entities/user.entity';
import { Post } from './../../post/entities/post.entity';
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
import { CommentLike } from './comment-like.entity';
// import { PostLike } from 'src/post/entities/post-like.entity'; // Olib tashlandi

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity; // ❌ XATOLAR OLIB TASHLANDI:
  // comments: Comment[];
  // commentLikes: CommentLike[];
  // postLikes: PostLike[];

  @Column()
  postId: number;

  @ManyToOne(() => Post, (post) => post.commentsEntity, { onDelete: 'CASCADE' }) // Postdagi nom 'commentsEntity' bo'lishi kerak
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ type: 'text' })
  content: string;

  // Commentga bosilgan Like'lar uchun (CommentLike orqali)
  @OneToMany(() => CommentLike, (commentLike) => commentLike.comment)
  commentLikes: CommentLike[];

  @Column({ default: 0 })
  likes: number;

  @Column({ nullable: true })
  parentId: number;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
