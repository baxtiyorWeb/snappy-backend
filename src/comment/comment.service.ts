import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentLike } from './entities/comment-like.entity';
import { Post } from './../post/entities/post.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepo: Repository<CommentLike>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async create(
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const { postId, parentId } = createCommentDto;

    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post topilmadi');
    }
    if (!post.allowComments) {
      throw new ForbiddenException('Bu postga komment yozish ruxsat etilmagan');
    }

    if (parentId) {
      const parentComment = await this.commentRepo.findOne({
        where: { id: parentId, postId },
      });
      if (!parentComment) {
        throw new NotFoundException('Javob beriladigan kommentariya topilmadi');
      }
    }

    const comment = this.commentRepo.create({
      ...createCommentDto,
      userId,
    });
    const newComment = await this.commentRepo.save(comment);

    await this.postRepo.increment({ id: postId }, 'comments', 1);

    return newComment;
  }

  async findCommentsByPost(
    postId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Comment[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.commentRepo.findAndCount({
      where: { postId, parentId: undefined },
      relations: [
        'user',
        'user.profile',
        'replies',
        'replies.user',
        'replies.user.profile',
      ],
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async remove(id: number, userId: number): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException('Kommentariya topilmadi');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException("Bu kommentariyani o'chirishga ruxsat yo'q");
    }

    await this.commentRepo.remove(comment);
    await this.postRepo.decrement({ id: comment.postId }, 'comments', 1);
  }

  async toggleLike(
    commentId: number,
    userId: number,
  ): Promise<{ liked: boolean; likes: number }> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Kommentariya topilmadi');
    }

    const existingLike = await this.commentLikeRepo.findOne({
      where: { commentId, userId },
    });

    if (existingLike) {
      await this.commentLikeRepo.remove(existingLike);
      comment.likes -= 1;
      await this.commentRepo.save(comment);
      return { liked: false, likes: comment.likes };
    } else {
      const newLike = this.commentLikeRepo.create({ commentId, userId });
      await this.commentLikeRepo.save(newLike);
      comment.likes += 1;
      await this.commentRepo.save(comment);
      return { liked: true, likes: comment.likes };
    }
  }
}
