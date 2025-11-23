// src/profile/profile.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { ProfileController } from './profile.controller';

// Services
import { ProfileService } from './profile.service';

// Entities
import { ProfileEntity } from './entities/profile.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UploadService } from 'src/file/uploadService';

@Module({
  imports: [
    // TypeORM: Barcha kerakli entitylar
    TypeOrmModule.forFeature([
      ProfileEntity,
      UserEntity,
    ]),


  ],

  controllers: [ProfileController],

  // Providers
  providers: [
    ProfileService,
    UploadService
  ],

  // Eksport: Boshqa modullar (masalan, NotesService) ishlatishi uchun
  exports: [
    ProfileService,
    TypeOrmModule,
  ],
})
export class ProfileModule { }