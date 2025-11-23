import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatEntity } from "./entities/chat.entity";
import { MessageEntity } from "./entities/message.entity";
import { ParticipantEntity } from "./entities/participant.entity";
import { MessageReadEntity } from "./entities/message-read.entity";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ProfileEntity } from "../profile/entities/profile.entity";
import { UploadService } from "../file/uploadService";
import { PassportModule } from "@nestjs/passport";

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([ChatEntity, MessageEntity, ParticipantEntity, MessageReadEntity, ProfileEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_ACCESS_SECRET") || "defaultSecret",
        signOptions: {
          expiresIn: Number(configService.get<string>('JWT_ACCESS_EXPIRES_IN')) || '3600s',
        },
      }),
    }),
  ],
  providers: [ChatService, ChatGateway, UploadService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule { }
