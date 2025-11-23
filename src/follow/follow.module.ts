import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowEntity } from './entities/follow.entity';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { UserEntity } from '../users/entities/user.entity';
import { ProfileEntity } from 'src/profile/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowEntity, UserEntity, UserEntity, ProfileEntity])],
  providers: [FollowService],
  controllers: [FollowController],
  exports: [FollowService],
})
export class FollowModule { }
