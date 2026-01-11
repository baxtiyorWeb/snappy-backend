import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/jwt-strategy/jwt-guards';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('create')
  async createChat(
    @Req() req: any,
    @Body() dto: { isGroup: boolean; participantIds: number[]; title?: string },
  ) {
    console.log('Frontenddan kelgan DTO:', dto);
    console.log('req.user:', req.user);

    return this.chatService.createChat(
      req?.user?.sub,
      dto.isGroup,
      dto.participantIds,
      dto.title,
    );
  }

  @Get('list')
  async getUserChats(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.chatService.getUserChats(
      req?.user?.sub,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':chatId/messages')
  async getChatMessages(
    @Req() req: any,
    @Param('chatId') chatId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.chatService.getChatMessages(
      req.user.id,
      parseInt(chatId),
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':chatId/details')
  async getChatDetails(@Req() req: any, @Param('chatId') chatId: string) {
    return this.chatService.getChatDetails(req.user.id, parseInt(chatId));
  }

  @Get('search')
  async searchChats(@Req() req: any, @Query('q') query: string) {
    return this.chatService.searchChats(req.user.id, query);
  }

  @Get(':chatId/unread-count')
  async getUnreadCount(@Req() req: any, @Param('chatId') chatId: string) {
    const count = await this.chatService.getUnreadCount(
      req.user.id,
      parseInt(chatId),
    );
    return { count };
  }

  @Post(':chatId/send')
  async sendMessage(
    @Req() req: any,
    @Param('chatId') chatId: string,
    @Body() dto: { text: string; replyToId?: number },
  ) {
    return this.chatService.sendMessage(
      req.user.id,
      parseInt(chatId),
      dto.text,
      dto.replyToId,
    );
  }

  @Post(':chatId/send-media')
  @UseInterceptors(FileInterceptor('file'))
  async sendMediaMessage(
    @Req() req: any,
    @Param('chatId') chatId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: { text?: string },
  ) {
    return this.chatService.sendMediaMessage(
      req.user.id,
      parseInt(chatId),
      file,
      dto.text,
    );
  }

  @Post(':chatId/mark-read/:messageId')
  async markRead(
    @Req() req: any,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.markRead(
      req.user.id,
      parseInt(chatId),
      parseInt(messageId),
    );
  }

  @Post(':chatId/mark-all-read')
  async markAllRead(@Req() req: any, @Param('chatId') chatId: string) {
    return this.chatService.markAllRead(req.user.id, parseInt(chatId));
  }

  @Patch('edit/:messageId')
  async editMessage(
    @Req() req: any,
    @Param('messageId') messageId: string,
    @Body() dto: { text: string },
  ) {
    return this.chatService.editMessage(
      req.user.id,
      parseInt(messageId),
      dto.text,
    );
  }

  @Delete('delete/:messageId')
  async deleteMessage(@Req() req: any, @Param('messageId') messageId: string) {
    return this.chatService.deleteMessage(req.user.id, parseInt(messageId));
  }

  @Post(':chatId/reply')
  async replyMessage(
    @Req() req: any,
    @Param('chatId') chatId: string,
    @Body() dto: { replyToId: number; text: string },
  ) {
    return this.chatService.replyMessage(
      req.user.id,
      parseInt(chatId),
      dto.replyToId,
      dto.text,
    );
  }

  @Post('forward')
  async forwardMessage(
    @Req() req: any,
    @Body() dto: { targetChatId: number; messageId: number },
  ) {
    return this.chatService.forwardMessage(
      req.user.id,
      dto.targetChatId,
      dto.messageId,
    );
  }

  @Post(':chatId/mute')
  async muteChat(@Req() req: any, @Param('chatId') chatId: string) {
    return this.chatService.muteChat(req.user.id, parseInt(chatId));
  }

  @Post(':chatId/unmute')
  async unmuteChat(@Req() req: any, @Param('chatId') chatId: string) {
    return this.chatService.unmuteChat(req.user.id, parseInt(chatId));
  }

  @Post(':chatId/add-participant')
  async addParticipant(
    @Req() req: any,
    @Param('chatId') chatId: string,
    @Body() dto: { profileIds: number[] },
  ) {
    return this.chatService.addParticipant(
      req.user.id,
      parseInt(chatId),
      dto.profileIds,
    );
  }

  @Post(':chatId/leave')
  async leaveChat(@Req() req: any, @Param('chatId') chatId: string) {
    return this.chatService.leaveChat(req.user.id, parseInt(chatId));
  }

  @Delete(':chatId')
  async deleteChat(@Req() req: any, @Param('chatId') chatId: string) {
    return this.chatService.deleteChat(req.user.id, parseInt(chatId));
  }

  @Get(':chatId/participants')
  async getParticipants(@Param('chatId') chatId: string) {
    return this.chatService.getParticipants(parseInt(chatId));
  }
}
