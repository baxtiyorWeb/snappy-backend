import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import qo'shish kerak
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity'; // Yangi import

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostLike])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
