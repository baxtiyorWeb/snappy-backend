import {
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== Chat DTOs ====================

export class CreateChatDto {
  @IsBoolean()
  isGroup: boolean;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one participant required' })
  @IsNumber({}, { each: true })
  participantIds: number[];

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;
}

export class UpdateChatDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class AddParticipantDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  profileIds: number[];
}

// ==================== Message DTOs ====================

export class SendMessageDto {
  @IsString()
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(5000, { message: 'Message too long (max 5000 characters)' })
  text: string;

  @IsOptional()
  @IsNumber()
  replyToId?: number;
}

export class EditMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  text: string;
}

export class SendMediaMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  text?: string;

  @IsEnum(['image', 'video', 'audio', 'file'])
  mediaType: 'image' | 'video' | 'audio' | 'file';
}

export class ForwardMessageDto {
  @IsNumber()
  targetChatId: number;

  @IsNumber()
  messageId: number;
}

export class ReplyMessageDto {
  @IsNumber()
  replyToId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  text: string;
}

// ==================== Participant DTOs ====================

export class UpdateParticipantDto {
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;

  @IsOptional()
  @IsBoolean()
  notifications?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customNickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  customColor?: string;
}

// ==================== Query DTOs ====================

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}

export class ChatMessagesQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  beforeId?: number; // Load messages before this ID

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  afterId?: number; // Load messages after this ID
}

export class SearchChatsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  query: string;
}

// ==================== Response DTOs ====================

export class MessageResponseDto {
  id: number;
  text: string;
  mediaUrl?: string;
  mediaType?: string;
  isDeleted: boolean;
  isForwarded: boolean;
  isDelivered: boolean;
  isEdited: boolean;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
  replyTo?: {
    id: number;
    text: string;
    senderId: number;
    senderName: string;
  };
  readBy?: {
    id: number;
    name: string;
    readAt: Date;
  }[];
}

export class ChatResponseDto {
  id: number;
  isGroup: boolean;
  title?: string;
  avatar?: string;
  description?: string;
  participants: {
    id: number;
    name: string;
    avatar?: string;
    isAdmin: boolean;
    isMuted: boolean;
  }[];
  lastMessage?: {
    id: number;
    text: string;
    senderId: number;
    sender: string;
    createdAt: Date;
  };
  unreadCount: number;
  createdAt: Date;
}

export class ParticipantResponseDto {
  id: number;
  name: string;
  avatar?: string;
  email?: string;
  isAdmin: boolean;
  isMuted: boolean;
  joinedAt: Date;
  lastReadAt?: Date;
}

// ==================== WebSocket DTOs ====================

export class TypingDto {
  @IsNumber()
  chatId: number;

  @IsBoolean()
  typing: boolean;

  @IsOptional()
  @IsString()
  userName?: string;
}

export class JoinChatDto {
  @IsNumber()
  chatId: number;
}

export class MarkReadDto {
  @IsNumber()
  chatId: number;

  @IsNumber()
  messageId: number;
}

export class MarkAllReadDto {
  @IsNumber()
  chatId: number;
}

export class GetUserStatusDto {
  @IsNumber()
  userId: number;
}
