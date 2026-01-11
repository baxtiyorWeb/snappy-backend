import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './../common/jwt-strategy/jwt-guards';

@ApiTags('Comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment or reply' })
  async create(@Body() createCommentDto: CreateCommentDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.commentService.create(userId, createCommentDto);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get comments for a specific post' })
  async findByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.commentService.findCommentsByPost(postId, page, limit);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment/reply' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.sub;
    return this.commentService.remove(id, userId);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like/Unlike a comment' })
  async toggleLike(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.sub;
    return this.commentService.toggleLike(id, userId);
  }
}
