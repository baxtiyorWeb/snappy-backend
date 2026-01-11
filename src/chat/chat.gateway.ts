import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<number, string>();
  private userLastSeen = new Map<number, Date>();
  private typingUsers = new Map<string, NodeJS.Timeout>();

  constructor(private chatService: ChatService) {}

  /* --------------------------- CONNECT --------------------------- */
  async handleConnection(socket: Socket) {
    const userId = Number(socket.handshake.auth?.userId);

    if (!userId || isNaN(userId)) {
      console.log('❌ Invalid userId, disconnecting');
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;
    this.onlineUsers.set(userId, socket.id);

    console.log(`✅ User connected: ${userId}, Socket: ${socket.id}`);

    // Barcha foydalanuvchilarga online statusni yuborish
    this.server.emit('user_online', {
      userId,
      timestamp: new Date(),
    });
  }

  /* --------------------------- DISCONNECT --------------------------- */
  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;
    if (!userId) return;

    this.onlineUsers.delete(userId);
    const lastSeen = new Date();
    this.userLastSeen.set(userId, lastSeen);

    console.log(`❌ User disconnected: ${userId}`);

    // Barcha typing holatlarini tozalash
    this.typingUsers.forEach((timeout, key) => {
      if (key.startsWith(`${userId}-`)) {
        clearTimeout(timeout);
        this.typingUsers.delete(key);
      }
    });

    this.server.emit('user_offline', {
      userId,
      lastSeen,
    });
  }

  /* --------------------------- JOIN CHAT --------------------------- */
  @SubscribeMessage('join_chat')
  async onJoinChat(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    socket.join(`chat_${data.chatId}`);
    console.log(`➡️ User ${socket.data.userId} joined chat ${data.chatId}`);

    // Chatga kirganda oxirgi xabarni read qilish
    const userId = socket.data.userId;
    const messages = await this.chatService.getChatMessages(
      userId,
      data.chatId,
      1,
      1,
    );

    if (messages.data.length > 0) {
      const lastMessage = messages.data[messages.data.length - 1];
      if (lastMessage.senderId !== userId) {
        await this.chatService.markRead(userId, data.chatId, lastMessage.id);

        // Yuboruvchiga read statusini yuborish
        this.server.to(`chat_${data.chatId}`).emit('message_read', {
          messageId: lastMessage.id,
          readerId: userId,
          chatId: data.chatId,
        });
      }
    }

    return { status: 'joined', chatId: data.chatId };
  }

  /* --------------------------- GET USER STATUS --------------------------- */
  @SubscribeMessage('get_user_status')
  onGetUserStatus(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const isOnline = this.onlineUsers.has(data.userId);
    const lastSeen = this.userLastSeen.get(data.userId) || null;

    socket.emit('user_status', {
      userId: data.userId,
      isOnline,
      lastSeen,
    });

    return {
      userId: data.userId,
      isOnline,
      lastSeen,
    };
  }

  /* --------------------------- SEND MESSAGE --------------------------- */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    data: {
      chatId: number;
      text: string;
      skipSelf?: boolean;
      replyToId?: number;
      messageId?: string;
    },
  ) {
    const senderId = socket.data.userId;

    console.log(
      `📤 Sending message from user ${senderId} to chat ${data.chatId}`,
    );

    // Service orqali xabarni saqlash
    const savedMsg = await this.chatService.sendMessage(
      senderId,
      data.chatId,
      data.text,
      data.replyToId,
    );

    const messagePayload = {
      id: savedMsg.id,
      text: savedMsg.text,
      senderId: savedMsg.senderId,
      senderName: savedMsg.senderName,
      senderAvatar: savedMsg.senderAvatar,
      chatId: data.chatId,
      createdAt: savedMsg.createdAt,
      replyTo: savedMsg.replyTo || null,
      status: 'delivered',
    };

    if (data.skipSelf) {
      socket.to(`chat_${data.chatId}`).emit('new_message', messagePayload);
    } else {
      this.server.to(`chat_${data.chatId}`).emit('new_message', messagePayload);
    }

    // Chat listdagi oxirgi xabarni yangilash uchun
    this.server.emit('chat_updated', {
      chatId: data.chatId,
      lastMessage: {
        id: savedMsg.id,
        text: savedMsg.text,
        senderId: savedMsg.senderId,
        senderName: savedMsg.senderName,
        createdAt: savedMsg.createdAt,
      },
    });

    console.log(`📨 Message sent to chat ${data.chatId}`);

    return { status: 'sent', messageId: savedMsg.id };
  }

  /* --------------------------- TYPING --------------------------- */
  @SubscribeMessage('typing')
  onTyping(
    @MessageBody() data: { chatId: number; typing: boolean; userName?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;
    const typingKey = `${userId}-${data.chatId}`;

    console.log(
      `⌨️ User ${userId} typing: ${data.typing} in chat ${data.chatId}`,
    );

    // Oldingi timeoutni tozalash
    if (this.typingUsers.has(typingKey)) {
      clearTimeout(this.typingUsers.get(typingKey));
      this.typingUsers.delete(typingKey);
    }

    if (data.typing) {
      // Typing holatini yuborish
      socket.to(`chat_${data.chatId}`).emit('user_typing', {
        userId,
        chatId: data.chatId,
        typing: true,
        userName: data.userName || 'User',
      });

      // 3 soniyadan keyin avtomatik to'xtatish
      const timeout = setTimeout(() => {
        socket.to(`chat_${data.chatId}`).emit('user_typing', {
          userId,
          chatId: data.chatId,
          typing: false,
          userName: data.userName || 'User',
        });
        this.typingUsers.delete(typingKey);
      }, 3000);

      this.typingUsers.set(typingKey, timeout);
    } else {
      // Typing to'xtatish
      socket.to(`chat_${data.chatId}`).emit('user_typing', {
        userId,
        chatId: data.chatId,
        typing: false,
        userName: data.userName || 'User',
      });
    }

    return { status: 'typing_sent' };
  }

  /* --------------------------- MARK READ --------------------------- */
  @SubscribeMessage('mark_read')
  async onMarkRead(
    @MessageBody() data: { chatId: number; messageId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    console.log(
      `👁️ User ${userId} read message ${data.messageId} in chat ${data.chatId}`,
    );

    await this.chatService.markRead(userId, data.chatId, data.messageId);

    // Yuboruvchiga xabar o'qilganligini bildirish
    this.server.to(`chat_${data.chatId}`).emit('message_read', {
      messageId: data.messageId,
      readerId: userId,
      chatId: data.chatId,
    });

    return { status: 'read_marked' };
  }

  /* --------------------------- MARK ALL READ --------------------------- */
  @SubscribeMessage('mark_all_read')
  async onMarkAllRead(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    console.log(
      `👁️ User ${userId} marking all messages as read in chat ${data.chatId}`,
    );

    const result = await this.chatService.markAllRead(userId, data.chatId);

    // Boshqalarga bildirish
    socket.to(`chat_${data.chatId}`).emit('all_messages_read', {
      chatId: data.chatId,
      readerId: userId,
      count: result.count,
    });

    return { status: 'all_marked_read', count: result.count };
  }

  /* --------------------------- EDIT --------------------------- */
  @SubscribeMessage('edit_message')
  async onEditMessage(
    @MessageBody() data: { chatId: number; messageId: number; text: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    console.log(`✏️ User ${userId} editing message ${data.messageId}`);

    const edited = await this.chatService.editMessage(
      userId,
      data.messageId,
      data.text,
    );

    const payload = {
      messageId: data.messageId,
      newText: data.text,
      chatId: data.chatId,
      editedAt: new Date(),
    };

    // Hammaga yuborish (o'ziga ham)
    this.server.to(`chat_${data.chatId}`).emit('message_edited', payload);

    // Chat listni yangilash
    this.server.emit('chat_updated', {
      chatId: data.chatId,
      lastMessage: {
        id: data.messageId,
        text: data.text,
        senderId: userId,
        createdAt: edited.updatedAt,
      },
    });

    return { status: 'edited' };
  }

  /* --------------------------- DELETE --------------------------- */
  @SubscribeMessage('delete_message')
  async onDelete(
    @MessageBody() data: { chatId: number; messageId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    console.log(`🗑️ User ${userId} deleting message ${data.messageId}`);

    await this.chatService.deleteMessage(userId, data.messageId);

    this.server.to(`chat_${data.chatId}`).emit('message_deleted', {
      messageId: data.messageId,
      chatId: data.chatId,
    });

    return { status: 'deleted' };
  }

  /* --------------------------- DELIVERED --------------------------- */
  @SubscribeMessage('delivered')
  onDelivered(@MessageBody() data: { chatId: number; messageId: number }) {
    console.log(
      `✅ Message ${data.messageId} delivered in chat ${data.chatId}`,
    );

    this.server.to(`chat_${data.chatId}`).emit('message_delivered', {
      messageId: data.messageId,
      chatId: data.chatId,
    });

    return { status: 'delivered' };
  }

  /* --------------------------- FORWARD --------------------------- */
  @SubscribeMessage('forward_message')
  async onForward(
    @MessageBody()
    data: { chatId: number; targetChatId: number; messageId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    console.log(
      `➡️ User ${userId} forwarding message ${data.messageId} to chat ${data.targetChatId}`,
    );

    const forwarded = await this.chatService.forwardMessage(
      userId,
      data.targetChatId,
      data.messageId,
    );

    this.server.to(`chat_${data.targetChatId}`).emit('new_message', forwarded);

    return { status: 'forwarded' };
  }

  /* --------------------------- MEDIA --------------------------- */
  @SubscribeMessage('send_media')
  async onSendMedia(
    @MessageBody()
    data: {
      chatId: number;
      mediaUrl: string;
      mediaType: string;
      text?: string;
    },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    console.log(`🖼️ User ${userId} sending media to chat ${data.chatId}`);

    const message = {
      id: Date.now(),
      senderId: userId,
      text: data.text || '',
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      createdAt: new Date(),
    };

    this.server.to(`chat_${data.chatId}`).emit('new_message', message);

    return { status: 'media_sent' };
  }
}
