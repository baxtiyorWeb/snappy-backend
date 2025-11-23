// src/post/dto/create-post.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  videoUrl: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  caption: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  hashtags?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  quality?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  allowComments?: boolean;

  @IsBoolean()
  @IsOptional()
  allowLikes?: boolean;

  @IsBoolean()
  @IsOptional()
  shareToFeed?: boolean;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  fileSize?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  brightness?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  volume?: number;

  @IsString()
  @IsOptional()
  filter?: string;

  @IsBoolean()
  @IsOptional()
  enableWatermark?: boolean;

  @IsBoolean()
  @IsOptional()
  enableNotifications?: boolean;

  @IsOptional()
  scheduledAt?: Date;
}

