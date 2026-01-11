// src/post/post.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ProfileEntity } from './../profile/entities/profile.entity';
import { PostLike } from './entities/post-like.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Post)
    private readonly profileRepo: Repository<ProfileEntity>,
    @InjectRepository(PostLike)
    private readonly postLikeRepo: Repository<PostLike>, // Yangi
  ) {}

  // CREATE
  async create(userId: number, createPostDto: CreatePostDto): Promise<Post> {
    const post = this.postRepo.create({
      ...createPostDto,
      userId,
    });
    return this.postRepo.save(post);
  }

  async findAll(page = 1, limit = 10, category?: string) {
    const skip = (page - 1) * limit;

    const where: any = { isPublic: true };
    if (category) where.category = category;

    // 🔥 user bilan birga profile-ni join qilamiz
    const [data, total] = await this.postRepo.findAndCount({
      where,
      relations: ['user', 'user.profile'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // GET USER POSTS
  async findUserPosts(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Post[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.postRepo.findAndCount({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // GET ONE
  async findOne(id: number): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['user', 'user.profile'],
    });

    if (!post) {
      throw new NotFoundException('Post topilmadi');
    }

    return post;
  }

  // UPDATE
  async update(
    id: number,
    userId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.findOne(id);

    if (post.userId !== userId) {
      throw new ForbiddenException("Bu postni tahrirlashga ruxsat yo'q");
    }

    Object.assign(post, updatePostDto);
    return this.postRepo.save(post);
  }

  // DELETE
  async remove(id: number, userId: number): Promise<void> {
    const post = await this.findOne(id);

    if (post.userId !== userId) {
      throw new ForbiddenException("Bu postni o'chirishga ruxsat yo'q");
    }

    await this.postRepo.remove(post);
  }

  // INCREMENT VIEWS
  async incrementViews(id: number): Promise<Post> {
    const post = await this.findOne(id);
    post.views += 1;
    return this.postRepo.save(post);
  }
  async toggleLike(
    postId: number,
    userId: number,
  ): Promise<{ liked: boolean; likes: number }> {
    const post = await this.postRepo.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post topilmadi');
    }

    const existingLike = await this.postLikeRepo.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      await this.postLikeRepo.remove(existingLike);
      post.likes -= 1;
      await this.postRepo.save(post);
      return { liked: false, likes: post.likes };
    } else {
      const newLike = this.postLikeRepo.create({ postId, userId });
      await this.postLikeRepo.save(newLike);
      post.likes += 1;
      await this.postRepo.save(post);
      return { liked: true, likes: post.likes };
    }
  }
  // GET TRENDING
  async getTrending(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Post[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.postRepo.findAndCount({
      where: { isPublic: true },
      relations: ['user'],
      order: { views: 'DESC', likes: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }
}
