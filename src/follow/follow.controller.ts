
import { Controller, Post, Get, Param, Req, UseGuards, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-strategy/jwt-guards';
import { FollowService } from './follow.service';
import type { Request } from 'express';

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(private readonly followService: FollowService) { }

  @Post("username/:username")
  async toggleFollowByUsername(
    @Param("username") username: string,
    @Req() req
  ) {
    const followerId = req.user?.["sub"];
    return this.followService.toggleFollow(followerId, username);
  }
  @Get('is-follow/:userId')
  async checkIsFollow(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: any,
  ) {
    const followerId = req.user?.["sub"];
    if (!followerId) throw new BadRequestException("Foydalanuvchi topilmadi");

    const result = await this.followService.isFollowing(followerId, userId);
    return { isFollowing: result };
  }



  @Get('followers/:userId')
  async getFollowers(@Param('userId', ParseIntPipe) userId: number) {
    return this.followService.getFollowers(userId);
  }

  @Get('following/:userId')
  async getFollowing(@Param('userId', ParseIntPipe) userId: number) {
    return this.followService.getFollowing(userId);
  }

  @Get('count/:userId')
  async getCounts(@Param('userId', ParseIntPipe) userId: number) {
    const followers = await this.followService.countFollowers(userId);
    const following = await this.followService.countFollowing(userId);
    return { ...followers, ...following };
  }
}