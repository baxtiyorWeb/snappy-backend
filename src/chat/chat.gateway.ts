import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";

import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";

@WebSocketGateway({ cors: { origin: "*" } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // userId -> socketId
  private onlineUsers = new Map<number, string>();

  // userId -> lastSeen(date)
  private userLastSeen = new Map<number, Date>();

  constructor(private chatService: ChatService) { }

  /* --------------------------- CONNECT --------------------------- */
  async handleConnection(socket: Socket) {
    const userId = Number(socket.handshake.auth?.userId);

    if (!userId || isNaN(userId)) {
      console.log("❌ Invalid userId, disconnecting");
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;
    this.onlineUsers.set(userId, socket.id);

    console.log(`✅ User connected: ${userId}`);

    // 🔥 Barcha foydalanuvchilarga xabar beriladi
    this.server.emit("user_online", {
      userId,
      timestamp: new Date(),
    });
  }

  /* --------------------------- DISCONNECT --------------------------- */
  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;

    if (!userId) return;

    this.onlineUsers.delete(userId);
    this.userLastSeen.set(userId, new Date());

    console.log(`❌ User disconnected: ${userId}`);

    this.server.emit("user_offline", {
      userId,
      lastSeen: this.userLastSeen.get(userId),
    });
  }

  /* --------------------------- JOIN CHAT --------------------------- */
  @SubscribeMessage("join_chat")
  onJoinChat(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    socket.join(`chat_${data.chatId}`);
    console.log(`➡️ User joined chat ${data.chatId}`);

    return { status: "joined", chatId: data.chatId };
  }

  /* --------------------------- SEND MESSAGE --------------------------- */
  @SubscribeMessage("send_message")
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { chatId: number; text: string; skipSelf?: boolean },
  ) {
    const senderId = socket.data.userId;

    const savedMsg = await this.chatService.sendMessage(
      senderId,
      data.chatId,
      data.text,
    );

    if (data.skipSelf) {
      socket.to(`chat_${data.chatId}`).emit("new_message", savedMsg);
    } else {
      this.server.to(`chat_${data.chatId}`).emit("new_message", savedMsg);
    }

    return { status: "sent", messageId: savedMsg.id };
  }

  /* --------------------------- TYPING --------------------------- */
  @SubscribeMessage("typing")
  onTyping(
    @MessageBody() data: { chatId: number; typing: boolean },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    this.server.to(`chat_${data.chatId}`).emit("typing", {
      userId,
      typing: data.typing,
    });

    return { status: "typing_sent" };
  }

  /* --------------------------- DELIVERED --------------------------- */
  @SubscribeMessage("delivered")
  onDelivered(@MessageBody() data: { chatId: number; messageId: number }) {
    this.server.to(`chat_${data.chatId}`).emit("message_delivered", {
      messageId: data.messageId,
    });

    return { status: "delivered" };
  }

  /* --------------------------- READ --------------------------- */
  @SubscribeMessage("mark_read")
  async onMarkRead(
    @MessageBody() data: { chatId: number; messageId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    await this.chatService.markRead(userId, data.chatId, data.messageId);

    this.server.to(`chat_${data.chatId}`).emit("message_read", {
      messageId: data.messageId,
      readerId: userId,
    });

    return { status: "read_marked" };
  }

  /* --------------------------- EDIT --------------------------- */
  @SubscribeMessage("edit_message")
  async onEditMessage(
    @MessageBody() data: { chatId: number; messageId: number; text: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    await this.chatService.editMessage(userId, data.messageId, data.text);

    this.server.to(`chat_${data.chatId}`).emit("message_edited", {
      messageId: data.messageId,
      newText: data.text,
    });

    return { status: "edited" };
  }

  /* --------------------------- DELETE --------------------------- */
  @SubscribeMessage("delete_message")
  async onDelete(
    @MessageBody() data: { chatId: number; messageId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    await this.chatService.deleteMessage(userId, data.messageId);

    this.server.to(`chat_${data.chatId}`).emit("message_deleted", {
      messageId: data.messageId,
    });

    return { status: "deleted" };
  }

  /* --------------------------- FORWARD --------------------------- */
  @SubscribeMessage("forward_message")
  async onForward(
    @MessageBody()
    data: { chatId: number; targetChatId: number; messageId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    const forwarded = await this.chatService.forwardMessage(
      userId,
      data.targetChatId,
      data.messageId,
    );

    this.server.to(`chat_${data.targetChatId}`).emit("new_message", forwarded);

    return { status: "forwarded" };
  }

  /* --------------------------- MEDIA --------------------------- */
  @SubscribeMessage("send_media")
  async onSendMedia(
    @MessageBody()
    data: { chatId: number; mediaUrl: string; mediaType: string; text?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    const message = {
      id: Date.now(),
      senderId: userId,
      text: data.text || "",
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      createdAt: new Date(),
    };

    this.server.to(`chat_${data.chatId}`).emit("new_message", message);

    return { status: "media_sent" };
  }

  /* --------------------------- GET USER STATUS --------------------------- */
  @SubscribeMessage("get_user_status")
  onGetUserStatus(@MessageBody() data: { userId: number }) {
    const isOnline = this.onlineUsers.has(data.userId);
    const lastSeen = this.userLastSeen.get(data.userId) || null;

    return {
      userId: data.userId,
      isOnline,
      lastSeen,
    };
  }
}
