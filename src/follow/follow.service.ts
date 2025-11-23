import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowEntity } from './entities/follow.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ProfileEntity } from 'src/profile/entities/profile.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
  ) { }

  async toggleFollow(followerId: number, targetProfileUsername: string) {
    if (!targetProfileUsername?.trim()) {
      throw new BadRequestException('Target username is missing');
    }

    const follower = await this.userRepo.findOne({ where: { id: followerId } });
    if (!follower) throw new NotFoundException('Follower not found');

    const targetProfile = await this.profileRepo.findOne({
      where: { username: targetProfileUsername },
      relations: ['user'],
    });

    if (!targetProfile) {
      throw new NotFoundException(`Profile @${targetProfileUsername} not found`);
    }

    if (!targetProfile.user && !targetProfile.userId) {
      throw new NotFoundException(`User @${targetProfileUsername} has no account`);
    }

    let followingUser: UserEntity | null;
    if (targetProfile.user) {
      followingUser = targetProfile.user;
    } else {
      followingUser = await this.userRepo.findOne({
        where: { id: targetProfile.userId },
      });
      if (!followingUser) throw new NotFoundException(`User not found for profile`);
    }

    if (follower.id === followingUser.id) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existing = await this.followRepo.findOne({
      where: {
        follower: { id: follower.id },
        following: { id: followingUser.id },
      },
    });

    if (existing) {
      await this.followRepo.remove(existing);
      return { message: 'Unfollowed', isFollowing: false };
    }

    const newFollow = this.followRepo.create({
      follower,
      following: followingUser,
    });

    console.log(newFollow);

    await this.followRepo.save(newFollow);

    return { message: 'Followed', isFollowing: true };
  }

  async getFollowers(userId: number) {
    const follows = await this.followRepo.find({
      where: { following: { id: userId } },
      relations: ['follower', 'follower.profile'],
    });

    return follows.map((f) => ({
      id: f.follower.id,
      username: f.follower.profile?.username,
      avatar: f.follower.profile?.avatar,
      firstName: f.follower.profile?.firstName,
      lastName: f.follower.profile?.lastName,
    }));
  }

  // --- Get all users a user is following ---
  async getFollowing(userId: number) {
    const follows = await this.followRepo.find({
      where: { follower: { id: userId } },
      relations: ['following', 'following.profile'],
    });

    return follows.map((f) => ({
      id: f.following.id,
      username: f.following.profile?.username,
      avatar: f.following.profile?.avatar,
      firstName: f.following.profile?.firstName,
      lastName: f.following.profile?.lastName,
    }));
  }

  async countFollowers(userId: number) {
    const count = await this.followRepo.count({
      where: { following: { id: userId } },
    });
    return { followersCount: count };
  }

  async countFollowing(userId: number) {
    const count = await this.followRepo.count({
      where: { follower: { id: userId } },
    });
    return { followingCount: count };
  }

  async isFollowing(followerId: number, targetId: number) {
    const existing = await this.followRepo.findOne({
      where: {
        follower: { id: followerId },
        following: { id: targetId },
      },
    });
    return !!existing;
  }
}