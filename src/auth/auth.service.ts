import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './../users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ProfileEntity } from './../profile/entities/profile.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
  ) { }

  async register(email: string, password: string, confirmPassword: string) {

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      throw new BadRequestException(
        'Faqat @gmail.com email orqali ro‘yxatdan o‘tish mumkin!',
      );
    }


    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existUser = await this.userRepo.findOne({ where: { email } });
    if (existUser) {
      throw new ConflictException('This email is already in use');
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = this.userRepo.create({ email, password: hashed });
    const savedUser = await this.userRepo.save(newUser);

    const tokens = await this.generateTokens(savedUser.id, savedUser.email);

    if (!tokens) {
      throw new BadRequestException('Failed to generate tokens');
    }

    if (!savedUser) {
      throw new BadRequestException('Failed to create user profile');
    }

    const existProfile = await this.profileRepo.findOne({ where: { userId: savedUser.id } });
    if (!existProfile) {
      const newProfile = this.profileRepo.create({ userId: savedUser.id });
      await this.profileRepo.save(newProfile);
    }

    return {
      message: 'User registered successfully',
      ...tokens,
      user: {
        id: savedUser.id,
        email: savedUser.email,
      },
    };
  }

  async login(email: string, password: string) {
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      throw new BadRequestException('Faqat @gmail.com email orqali kirish mumkin!');
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    let existProfile = await this.profileRepo.findOne({ where: { userId: user.id } });

    if (!existProfile) {
      try {
        const username = `user_${user.id}_${Math.floor(Math.random() * 10000)}`;
        const newProfile = this.profileRepo.create({ userId: user.id, username });
        existProfile = await this.profileRepo.save(newProfile);
      } catch (err) {
        if (err.code === '23505') {
          existProfile = await this.profileRepo.findOne({ where: { userId: user.id } });
        } else {
          throw err;
        }
      }
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      message: 'Login successful',
      ...tokens,
      user: { id: user.id, email: user.email },
    };
  }






  // 🔄 REFRESH TOKEN
  async refreshToken(refreshToken: string) {
    try {
      // 1️⃣ Refresh tokenni tekshiramiz
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      });

      // 2️⃣ Yangi tokenlar yaratamiz
      const tokens = await this.generateTokens(payload.sub, payload.email);

      return {
        message: 'Token refreshed successfully',
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // 🧩 TOKEN GENERATOR
  private async generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access_secret',
      expiresIn: '1h',
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }
}
