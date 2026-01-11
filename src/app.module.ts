import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { FollowModule } from './follow/follow.module';
import { ChatModule } from './chat/chat.module';
import { FileModule } from './file/file.module';

import { UserEntity } from './users/entities/user.entity';
import { ProfileEntity } from './profile/entities/profile.entity';
import { FollowEntity } from './follow/entities/follow.entity';
import { PostModule } from './post/post.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_ACCESS_SECRET') || 'defaultSecret',
        signOptions: {
          expiresIn:
            Number(configService.get<string>('JWT_ACCESS_EXPIRES_IN')) ||
            '3600s',
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [UserEntity, ProfileEntity, FollowEntity],
        autoLoadEntities: true,
        synchronize: true,
        ssl:
          config.get<string>('NODE_ENV') !== 'production'
            ? { rejectUnauthorized: false }
            : false,
        // logging: true,
      }),
    }),

    UsersModule,
    AuthModule,
    ProfileModule,
    FollowModule,
    ChatModule,
    FileModule,
    PostModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
