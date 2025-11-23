import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Param,
  UploadedFile,
  UseInterceptors,
  Query,
  Delete,
  Patch,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../common/jwt-strategy/jwt-guards";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("chat")
export class ChatController {
  constructor(private chat: ChatService) { }

  // ============ CREATE ============
  @Post("create")
  create(
    @Req() req,
    @Body() dto: { isGroup: boolean; title?: string; participants: number[] }
  ) {
    return this.chat.createChat(req.user.sub, dto.isGroup, dto.participants, dto.title);
  }

  // ============ GET ============

  /** 📋 Get all chats for current user */
  @Get()
  async getChats(
    @Req() req,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20
  ) {
    const chatsData = await this.chat.getUserChats(req.user.sub, page, limit);

    return {
      success: true,
      data: chatsData.data,
      total: chatsData.total,
      page: chatsData.page,
      limit: chatsData.limit,
    };
  }


  /** 📞 Get specific chat details */
  @Get(":chatId")
  getChatDetails(@Req() req, @Param("chatId") chatId: number) {
    return this.chat.getChatDetails(req.user.sub, chatId);
  }

  /** 💬 Get chat messages with pagination */
  @Get(":chatId/messages")
  async getChatMessages(
    @Req() req,
    @Param("chatId") chatId: number,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 50
  ) {
    const messagesData = await this.chat.getChatMessages(req.user.sub, chatId, page, limit);

    return {
      success: true,
      data: messagesData.data,
      total: messagesData.total,
      page: messagesData.page,
      limit: messagesData.limit,
    };
  }

  /** 🔍 Search chats */
  @Get("search/:query")
  searchChats(@Req() req, @Param("query") query: string) {
    return this.chat.searchChats(req.user.sub, query);
  }

  /** 👥 Get chat participants */
  @Get(":chatId/participants")
  getParticipants(@Param("chatId") chatId: number) {
    return this.chat.getParticipants(chatId);
  }

  /** 📊 Get unread message count */
  @Get(":chatId/unread-count")
  async getUnreadCount(@Req() req, @Param("chatId") chatId: number) {
    const count = await this.chat.getUnreadCount(req.user.sub, chatId);
    return count;
  }

  // ============ SEND MESSAGES ============

  @Post(":id/send")
  async send(@Req() req, @Param("id") chatId: number, @Body("text") text: string) {
    const message = await this.chat.sendMessage(req.user.sub, chatId, text);

    return {
      success: true,
      id: message.id,
      message,
    };
  }

  @Post(":id/media")
  @UseInterceptors(FileInterceptor("file"))
  sendMedia(
    @Req() req,
    @Param("id") chatId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body("text") text?: string
  ) {
    return this.chat.sendMediaMessage(req.user.sub, chatId, file, text);
  }

  // ============ MESSAGE ACTIONS ============

  @Post(":id/read/:messageId")
  read(@Req() req, @Param("id") chatId: number, @Param("messageId") messageId: number) {
    return this.chat.markRead(req.user.sub, chatId, messageId);
  }

  @Patch("edit/:messageId")
  edit(@Req() req, @Param("messageId") messageId: number, @Body("text") text: string) {
    return this.chat.editMessage(req.user.sub, messageId, text);
  }

  @Delete("delete/:messageId")
  delete(@Req() req, @Param("messageId") messageId: number) {
    return this.chat.deleteMessage(req.user.sub, messageId);
  }

  @Post(":chatId/reply/:replyToId")
  reply(
    @Req() req,
    @Param("chatId") chatId: number,
    @Param("replyToId") replyToId: number,
    @Body("text") text: string
  ) {
    return this.chat.replyMessage(req.user.sub, chatId, replyToId, text);
  }

  @Post("forward/:chatId/:messageId")
  forward(
    @Req() req,
    @Param("chatId") targetChatId: number,
    @Param("messageId") messageId: number
  ) {
    return this.chat.forwardMessage(req.user.sub, targetChatId, messageId);
  }

  // ============ CHAT SETTINGS ============

  /** 🔇 Mute chat */
  @Post(":chatId/mute")
  muteChat(@Req() req, @Param("chatId") chatId: number) {
    return this.chat.muteChat(req.user.sub, chatId);
  }

  /** 🔊 Unmute chat */
  @Post(":chatId/unmute")
  unmuteChat(@Req() req, @Param("chatId") chatId: number) {
    return this.chat.unmuteChat(req.user.sub, chatId);
  }

  // ============ GROUP ACTIONS ============

  /** 👥 Add participants to group */
  @Post(":chatId/add-participant")
  addParticipant(
    @Req() req,
    @Param("chatId") chatId: number,
    @Body("profileIds") profileIds: number[]
  ) {
    return this.chat.addParticipant(req.user.sub, chatId, profileIds);
  }

  /** 🚪 Leave chat */
  @Post(":chatId/leave")
  leaveChat(@Req() req, @Param("chatId") chatId: number) {
    return this.chat.leaveChat(req.user.sub, chatId);
  }

  /** 🗑️ Delete chat (admin only) */
  @Delete(":chatId")
  deleteChat(@Req() req, @Param("chatId") chatId: number) {
    return this.chat.deleteChat(req.user.sub, chatId);
  }
}