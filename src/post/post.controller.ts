// src/post/post.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './../common/jwt-strategy/jwt-guards';
import { NotFoundError } from 'rxjs';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) { }

  // ============================
  // CREATE POST
  // ============================
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  async create(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.postService.create(userId, createPostDto);
  }

  // ============================
  // GET ALL POSTS (Feed)
  // ============================
  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('category') category?: string,
  ) {
    return this.postService.findAll(page, limit, category,);
  }

  // ============================
  // GET USER'S POSTS
  // ============================
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get posts by user ID' })
  async findUserPosts(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.postService.findUserPosts(userId, page, limit);
  }

  // ============================
  // GET MY POSTS
  // ============================
  @Get('my-posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user posts' })
  async findMyPosts(
    @Req() req: any,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    const userId = req.user?.sub;
    return this.postService.findUserPosts(userId, page, limit);
  }

  // ============================
  // GET SINGLE POST
  // ============================
  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findOne(id);
  }

  // ============================
  // UPDATE POST
  // ============================
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update post' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;
    return this.postService.update(id, userId, updatePostDto);
  }

  // ============================
  // DELETE POST
  // ============================
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete post' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.sub;
    return this.postService.remove(id, userId);
  }

  // ============================
  // INCREMENT VIEWS
  // ============================
  @Post(':id/view')
  @ApiOperation({ summary: 'Increment post views' })
  async incrementView(@Param('id', ParseIntPipe) id: number) {
    return this.postService.incrementViews(id);
  }

  // ============================
  // LIKE POST
  // ============================
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like/Unlike post' })
  async toggleLike(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.sub;
    return this.postService.toggleLike(id, userId);
  }
  

  // ============================
  // GET TRENDING POSTS
  // ============================
  @Get('feed/trending')
  @ApiOperation({ summary: 'Get trending posts' })
  async getTrending(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.postService.getTrending(page, limit);
  }
}