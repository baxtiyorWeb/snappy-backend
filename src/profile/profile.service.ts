import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileEntity } from './entities/profile.entity';
import { In, Repository } from 'typeorm';
import { UserEntity } from './../users/entities/user.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileEntity)
    private profileRepo: Repository<ProfileEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) { }


  async getOwnerProfile(id: number) {
    if (!id) throw new BadRequestException('ID is required');

    const user = await this.userRepo.findOne({
      where: { id },
      relations: [
        'profile',
        'followers',
        'followers.follower',
        'followers.follower.profile',
        'following',
        'following.following',
        'following.following.profile',
        'posts',
      ],
    });

    if (!user) { throw new NotFoundException('User not found'); }

    let profile = await this.profileRepo.findOne({ where: { userId: user.id } });

    // === Profile yaratish bo‘limi (o‘zgarmagan) ===
    if (!profile) {
      try {
        const username = `user_${user.id}_${Math.floor(Math.random() * 10000)}`;
        const newProfile = this.profileRepo.create({
          user,
          userId: user.id,
          username,
          firstName: 'User',
          lastName: 'Name',
        });
        profile = await this.profileRepo.save(newProfile);
        user.profile = profile;
        await this.userRepo.save(user);
      } catch (err) {
        if (err.code === '23505') {
          profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        } else {
          throw new InternalServerErrorException('Profile creation failed: ' + err.message);
        }
      }
    }

    // 🔥 Hamma postlar bo‘yicha jami likes hisoblash
    const totalLikes = user.posts.reduce((sum, post) => sum + post.likes, 0);

    // 🔥 Clean response
    const cleaned = {
      id: user.id,
      email: user.email,
      profile: profile && {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        avatar: profile.avatar,
        coverImage: profile.coverImage,
      },

      followers: user.followers?.map((f) => ({
        id: f.id,
        createdAt: f.createdAt,
        profile: f.follower?.profile && {
          id: f.follower.profile.id,
          username: f.follower.profile.username,
          firstName: f.follower.profile.firstName,
          lastName: f.follower.profile.lastName,
          avatar: f.follower.profile.avatar,
        },
      })) ?? [],

      following: user.following?.map((f) => ({
        id: f.id,
        createdAt: f.createdAt,
        profile: f.following?.profile && {
          id: f.following.profile.id,
          username: f.following.profile.username,
          firstName: f.following.profile.firstName,
          lastName: f.following.profile.lastName,
          avatar: f.following.profile.avatar,
        },
      })) ?? [],

      // 🔥 Posts (faqat kerakli fieldlar)
      posts: user.posts.map((p) => ({
        id: p.id,
        videoUrl: p.videoUrl,
        thumbnailUrl: p.thumbnailUrl,
        caption: p.caption,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        views: p.views,
        createdAt: p.createdAt,
      })),

      // 🔥 User statistikasi
      stats: {
        totalPosts: user.posts.length,
        totalLikes,
      },
    };

    return cleaned;
  }




  async getByUsername(username: string) {
    const profile = await this.profileRepo.findOne({
      where: { username },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return profile;
  }

  async getUserProfile(username: string, requesterId?: number) {
    const profile = await this.profileRepo.findOne({
      where: { username },
      relations: ['user',],
    });

    if (!profile) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const isOwner = requesterId === profile.user.id;


    return {
      id: profile.id,
      username: profile.username,
      avatar: profile.avatar,
      coverImage: profile.coverImage,
      user: {
        id: profile.user.id,
        username: profile.username,
        email: isOwner ? profile.user.email : undefined,
      },
    };
  }




  // EXPORT
  async exportProfile(userId: number) {
    const profile = await this.getOwnerProfile(userId);
    const data = JSON.stringify(profile, null, 2);
    return { data, filename: `${profile?.profile?.username}-profile.json` };
  }



  async updateProfile(id: number, profileData: Partial<ProfileEntity>) {
    try {
      if (!id) throw new BadRequestException("id not submitting");

      const user = await this.userRepo.findOne({
        where: { id },
        relations: ['profile']
      });

      if (!user) throw new NotFoundException("User not found");

      // 🔹 Username conflict check
      if (profileData.username) {
        const existUsername = await this.profileRepo.findOne({
          where: { username: profileData.username },
        });

        if (existUsername && existUsername.userId !== id) {
          throw new ConflictException('This username is already taken');
        }
      }

      let profile = await this.profileRepo.findOne({ where: { userId: user.id } });

      if (!profile) {
        profile = this.profileRepo.create({
          user,
          userId: user.id,
          ...profileData,
        });

        try {
          return await this.profileRepo.save(profile);
        } catch (err) {
          // Parallel request yoki duplicate holatni tutish
          if (err.code === '23505') {
            profile = await this.profileRepo.findOne({ where: { userId: user.id } });
          } else {
            throw err;
          }
        }
      }
      if (!profile) {
        throw new InternalServerErrorException('Profile could not be loaded');
      }
      Object.assign(profile, profileData);
      return await this.profileRepo.save(profile);

    } catch (error) {
      throw new InternalServerErrorException('Profile update failed: ' + error.message);
    }
  }



  async deleteProfile(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepo.remove(user); // profile ham o‘chadi (cascade bo‘lsa)

    return { message: 'User and profile deleted successfully' };
  }

  async getBySlug(slug: string, viewerId?: number) {
    const profile = await this.profileRepo.findOne({
      where: { slug },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async follow(followerId: number, followingId: number) {
    const [follower, following] = await Promise.all([
      this.ensureProfile(followerId),
      this.profileRepo.findOne({ where: { id: followingId }, relations: ['followers'] }),
    ]);

    if (!following) throw new NotFoundException('User not found');
    if (follower.id === following.id) throw new BadRequestException('Cannot follow yourself');

    if (following.followers?.some((f) => f.id === follower.id))
      throw new ConflictException('Already following');

    following.followers = [...(following.followers || []), follower];
    await this.profileRepo.save(following);
    return { message: 'Followed', following: true };
  }

  async unfollow(followerId: number, followingId: number) {
    const following = await this.profileRepo.findOne({
      where: { id: followingId },
      relations: ['followers'],
    });
    if (!following) throw new NotFoundException('User not found');

    following.followers = following.followers.filter((f) => f.id !== followerId);
    await this.profileRepo.save(following);
    return { message: 'Unfollowed', following: false };
  }

  async getFollowers(userId: number) {
    const profile = await this.ensureProfile(userId);
    const full = await this.profileRepo.findOne({
      where: { id: profile.id },
      relations: ['followers'],
    });
    if (!full) throw new NotFoundException('Profile not found');
    return full.followers.map((p) => (p));
  }
  async getFollowing(userId: number) {
    const profile = await this.ensureProfile(userId);
    const full = await this.profileRepo.findOne({
      where: { id: profile.id },
      relations: ['following'],
    });
    if (!full) throw new NotFoundException('Profile not found');
    return full.following.map((p) => (p));
  }





  // === HELPER ===
  private async ensureProfile(userId: number): Promise<ProfileEntity> {
    let profile = await this.profileRepo.findOne({ where: { user: { id: userId } } });
    if (!profile) {
      const username = `user_${userId}_${Math.random().toString(36).substr(2, 5)}`;
      profile = this.profileRepo.create({ userId, username, slug: username });
      profile = await this.profileRepo.save(profile);
    }
    return profile;
  }
}
