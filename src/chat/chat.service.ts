import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  LessThan,
  In,
  Not,
  IsNull,
  MoreThan,
  DeepPartial,
} from 'typeorm';
import { ChatEntity } from './entities/chat.entity';
import { MessageEntity } from './entities/message.entity';
import { ParticipantEntity } from './entities/participant.entity';
import { MessageReadEntity } from './entities/message-read.entity';
import { ProfileEntity } from '../profile/entities/profile.entity';
import { UploadService } from 'src/file/uploadService';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity) private chatRepo: Repository<ChatEntity>,
    @InjectRepository(MessageEntity) private msgRepo: Repository<MessageEntity>,
    @InjectRepository(ParticipantEntity)
    private partRepo: Repository<ParticipantEntity>,
    @InjectRepository(MessageReadEntity)
    private readRepo: Repository<MessageReadEntity>,
    @InjectRepository(ProfileEntity)
    private profileRepo: Repository<ProfileEntity>,
    private readonly uploadService: UploadService,
  ) {}

  private async ensureProfile(userId: number) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  /** 🔹 Create 1-to-1 or Group Chat */
  async createChat(
    userId: number,
    isGroup: boolean,
    participantIds: number[],
    title?: string,
  ) {
    const me = await this.ensureProfile(userId);

    // Target IDlarni unikal qilish
    const ids = [...new Set(participantIds)];

    if (!isGroup) {
      if (ids.length !== 1) {
        throw new BadRequestException(
          'Direct chat requires exactly one participant',
        );
      }

      const targetId = ids[0];

      if (targetId === me.id) {
        throw new BadRequestException('Cannot chat with yourself');
      }

      // DM KEY (agar chat bor bo'lsa qaytaramiz)
      const dmKey = [me.id, targetId].sort().join('-');
      let chat = await this.chatRepo.findOne({ where: { dmKey } });

      if (chat) return chat;

      // Yangi chat yaratamiz
      chat = this.chatRepo.create({
        dmKey,
        isGroup: false,
      });

      chat = await this.chatRepo.save(chat);

      // 2ta participant qo'shamiz
      await this.partRepo.save([
        this.partRepo.create({ chat, profile: me }),
        this.partRepo.create({ chat, profile: { id: targetId } as any }),
      ]);

      return chat;
    }

    // GROUP CHAT LOGIKA
    if (ids.length < 1) {
      throw new BadRequestException(
        'Group must contain at least one other member',
      );
    }

    // Chatni yaratamiz
    const chat = await this.chatRepo.save(
      this.chatRepo.create({
        isGroup: true,
        title: title ?? null,
      }),
    );

    // Hamma profillarni topamiz
    const allProfiles = await this.profileRepo.find({
      where: { id: In([userId, ...ids]) },
    });

    await this.partRepo.save(
      allProfiles.map((profile) => this.partRepo.create({ chat, profile })),
    );

    return chat;
  }

  /** 📋 Get All Chats for User */
  async getUserChats(userId: number, page: number = 1, limit: number = 20) {
    const me = await this.ensureProfile(userId);

    const chats = await this.chatRepo
      .createQueryBuilder('chat')
      .innerJoinAndSelect(
        'chat.participants',
        'participant',
        'participant.profileId = :profileId',
        { profileId: me.id },
      )
      .leftJoinAndSelect('chat.participants', 'allParticipants')
      .leftJoinAndSelect('allParticipants.profile', 'profile')
      .leftJoinAndSelect(
        'chat.messages',
        'message',
        `message."createdAt" = (
          SELECT MAX(m."createdAt")
          FROM messages m
          WHERE m."chatId" = chat.id
        )`,
      )
      .leftJoinAndSelect('message.sender', 'sender')
      .orderBy('message.createdAt', 'DESC', 'NULLS LAST')
      .addOrderBy('chat.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await this.getUnreadCount(userId, chat.id);

        return {
          id: chat.id,
          isGroup: chat.isGroup,
          title: chat.title,
          avatar: chat.avatar,
          participants: chat.participants.map((p) => ({
            id: p.profile.id,
            name: p.profile.username,
            avatar: p.profile.avatar,
            isAdmin: p.isAdmin,
          })),
          lastMessage: chat.messages[0]
            ? {
                id: chat.messages[0].id,
                text: chat.messages[0].text,
                senderId: chat.messages[0].sender.id,
                sender: chat.messages[0].sender.username,
                createdAt: chat.messages[0].createdAt,
                mediaType: chat.messages[0].mediaType,
              }
            : null,
          unreadCount,
        };
      }),
    );

    return {
      data: formattedChats,
      total: await this.chatRepo
        .createQueryBuilder('chat')
        .innerJoin(
          'chat.participants',
          'participant',
          'participant.profileId = :profileId',
          { profileId: me.id },
        )
        .getCount(),
      page,
      limit,
    };
  }

  /** 💬 Get Chat Messages */
  async getChatMessages(
    userId: number,
    chatId: number,
    page: number = 1,
    limit: number = 50,
  ) {
    const me = await this.ensureProfile(userId);

    const isParticipant = await this.partRepo.findOne({
      where: { chat: { id: chatId }, profile: { id: me.id } },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const [messages, total] = await this.msgRepo.findAndCount({
      where: { chat: { id: chatId } },
      relations: [
        'sender',
        'replyTo',
        'replyTo.sender',
        'reads',
        'reads.reader',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      mediaUrl: msg.mediaUrl,
      mediaType: msg.mediaType,
      isDeleted: msg.isDeleted,
      isForwarded: msg.isForwarded,
      isDelivered: msg.isDelivered,
      senderId: msg.sender.id,
      senderName: msg.sender.username,
      senderAvatar: msg.sender.avatar,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      replyTo: msg.replyTo
        ? {
            id: msg.replyTo.id,
            text: msg.replyTo.text,
            senderId: msg.replyTo.sender.id,
            senderName: msg.replyTo.sender.username,
          }
        : null,
      readBy: msg.reads.map((r) => ({
        id: r.reader.id,
        name: r.reader.username,
        readAt: r.readAt,
      })),
    }));

    return {
      data: formattedMessages.reverse(),
      total,
      page,
      limit,
    };
  }

  /** 📞 Get Chat Details */
  async getChatDetails(userId: number, chatId: number) {
    const me = await this.ensureProfile(userId);

    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
      relations: ['participants', 'participants.profile'],
    });

    if (!chat) throw new NotFoundException('Chat not found');

    const isParticipant = chat.participants.some((p) => p.profile.id === me.id);
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const messageCount = await this.msgRepo.count({
      where: { chat: { id: chatId } },
    });

    return {
      id: chat.id,
      isGroup: chat.isGroup,
      title: chat.title,
      avatar: chat.avatar,
      description: chat.description || null,
      participants: chat.participants.map((p) => ({
        id: p.profile.id,
        name: p.profile.username,
        avatar: p.profile.avatar,
        email: p.profile?.user?.email,
        isAdmin: p.isAdmin,
        isMuted: p.isMuted,
        joinedAt: p.createdAt,
      })),
      createdAt: chat.createdAt,
      messageCount,
    };
  }

  /** 🔍 Search Chats */
  async searchChats(userId: number, query: string) {
    const me = await this.ensureProfile(userId);

    const chats = await this.chatRepo
      .createQueryBuilder('chat')
      .innerJoinAndSelect(
        'chat.participants',
        'participant',
        'participant.profileId = :profileId',
        { profileId: me.id },
      )
      .leftJoinAndSelect('chat.participants', 'allParticipants')
      .leftJoinAndSelect('allParticipants.profile', 'profile')
      .where('chat.title ILIKE :query OR profile.username ILIKE :query', {
        query: `%${query}%`,
      })
      .orderBy('chat.title', 'ASC')
      .getMany();

    return chats.map((chat) => ({
      id: chat.id,
      isGroup: chat.isGroup,
      title: chat.title,
      avatar: chat.avatar,
      participants: chat.participants.map((p) => ({
        id: p.profile.id,
        name: p.profile.username,
        avatar: p.profile.avatar,
      })),
    }));
  }

  /** 📊 Get Unread Count */
  async getUnreadCount(userId: number, chatId: number) {
    const me = await this.ensureProfile(userId);

    const participant = await this.partRepo.findOne({
      where: { chat: { id: chatId }, profile: { id: me.id } },
    });
    if (!participant) return 0;

    const lastReadAt = participant.lastReadAt;

    const unreadMessages = await this.msgRepo.count({
      where: {
        chat: { id: chatId },
        sender: { id: Not(me.id) },
        ...(lastReadAt ? { createdAt: MoreThan(lastReadAt) } : {}),
      },
    });

    return unreadMessages;
  }

  /** 📤 Send Message */
  async sendMessage(
    userId: number,
    chatId: number,
    text: string,
    replyToId?: number,
  ) {
    const profile = await this.ensureProfile(userId);

    let participant = await this.partRepo.findOne({
      where: { chat: { id: chatId }, profile: { id: profile.id } },
    });

    if (!participant) {
      console.log(`User ${userId} chatga avtomatik qo'shilyapti ${chatId}`);
      participant = this.partRepo.create({
        chat: { id: chatId } as any,
        profile: profile,
        lastReadAt: new Date(),
      });
      await this.partRepo.save(participant);
    }

    const msgData: DeepPartial<MessageEntity> = {
      chat: { id: chatId },
      sender: profile,
      text,
      isDelivered: true,
    };
    if (replyToId) {
      const replyToMsg = await this.msgRepo.findOne({
        where: { id: replyToId },
        relations: ['sender'],
      });
      if (replyToMsg) {
        msgData.replyTo = replyToMsg;
      }
    }

    const msg: MessageEntity = this.msgRepo.create(msgData);
    const saved: MessageEntity = await this.msgRepo.save(msg);

    await this.readRepo.save(
      this.readRepo.create({ message: saved, reader: profile }),
    );

    participant.lastReadAt = saved.createdAt;
    await this.partRepo.save(participant);

    const replyToData = saved.replyTo
      ? {
          id: saved.replyTo.id,
          text: saved.replyTo.text,
          senderId: saved.replyTo.sender.id,
          senderName: saved.replyTo.sender.username,
        }
      : null;

    console.log({
      id: saved.id,
      text,
      senderId: userId,
      senderName: profile.username || 'User',
      chatId,
      senderAvatar: profile.avatar,
      createdAt: saved.createdAt,
      replyTo: replyToData,
    });

    return {
      id: saved.id,
      text,
      senderId: userId,
      senderName: profile.username || 'User',
      chatId,
      senderAvatar: profile.avatar,
      createdAt: saved.createdAt,
      replyTo: replyToData,
    };
  }

  /** 📖 Mark Read */
  async markRead(userId: number, chatId: number, messageId: number) {
    const me = await this.ensureProfile(userId);
    const msg = await this.msgRepo.findOne({
      where: { id: messageId, chat: { id: chatId } },
      relations: ['sender'],
    });

    if (!msg) throw new NotFoundException('Message not found');

    // O'z xabaringizni read qilishning hojati yo'q
    if (msg.sender.id === me.id) {
      return { message: 'Own message, already read' };
    }

    const exist = await this.readRepo.findOne({
      where: { message: { id: msg.id }, reader: { id: me.id } },
    });

    if (!exist) {
      await this.readRepo.save(
        this.readRepo.create({ message: msg, reader: me }),
      );
    }

    const part = await this.partRepo.findOne({
      where: { chat: { id: chatId }, profile: { id: me.id } },
    });

    if (part) {
      part.lastReadAt = msg.createdAt;
      await this.partRepo.save(part);
    }

    return { message: 'Marked as read' };
  }

  /** 📖 Mark All Read */
  async markAllRead(userId: number, chatId: number) {
    const me = await this.ensureProfile(userId);

    const participant = await this.partRepo.findOne({
      where: { chat: { id: chatId }, profile: { id: me.id } },
    });

    if (!participant) throw new ForbiddenException('Not a participant');

    // Chatdagi barcha o'qilmagan xabarlarni olish
    const unreadMessages = await this.msgRepo.find({
      where: {
        chat: { id: chatId },
        sender: { id: Not(me.id) },
        ...(participant.lastReadAt
          ? { createdAt: MoreThan(participant.lastReadAt) }
          : {}),
      },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
    });

    // Barcha xabarlarni o'qilgan deb belgilash
    for (const msg of unreadMessages) {
      const exist = await this.readRepo.findOne({
        where: { message: { id: msg.id }, reader: { id: me.id } },
      });

      if (!exist) {
        await this.readRepo.save(
          this.readRepo.create({ message: msg, reader: me }),
        );
      }
    }

    // lastReadAt ni yangilash
    if (unreadMessages.length > 0) {
      participant.lastReadAt = unreadMessages[0].createdAt;
      await this.partRepo.save(participant);
    }

    return {
      message: 'All messages marked as read',
      count: unreadMessages.length,
    };
  }

  async getParticipants(chatId: number) {
    return this.partRepo.find({
      where: { chat: { id: chatId } },
      relations: ['profile'],
    });
  }

  async sendMediaMessage(
    userId: number,
    chatId: number,
    file: Express.Multer.File,
    text?: string,
  ) {
    const me = await this.ensureProfile(userId);
    const participant = await this.partRepo.findOne({
      where: { chat: { id: chatId }, profile: { id: me.id } },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    const url = await this.uploadService.uploadFile(file);

    let type: 'image' | 'video' | 'audio' | null = null;
    if (file.mimetype.startsWith('image')) type = 'image';
    else if (file.mimetype.startsWith('video')) type = 'video';
    else if (file.mimetype.startsWith('audio')) type = 'audio';

    const msg = this.msgRepo.create({
      chat: { id: chatId } as any,
      sender: me,
      text: text || '',
      mediaUrl: url,
      mediaType: type,
      isDelivered: true,
    });
    const saved = await this.msgRepo.save(msg);

    // Read entry yaratish
    await this.readRepo.save(
      this.readRepo.create({ message: saved, reader: me }),
    );

    // lastReadAt yangilash
    participant.lastReadAt = saved.createdAt;
    await this.partRepo.save(participant);

    return {
      id: saved.id,
      text: saved.text,
      mediaUrl: saved.mediaUrl,
      mediaType: saved.mediaType,
      senderId: me.id,
      senderName: me.username,
      senderAvatar: me.avatar,
      createdAt: saved.createdAt,
      chatId,
    };
  }

  async editMessage(userId: number, messageId: number, newText: string) {
    const me = await this.ensureProfile(userId);
    const msg = await this.msgRepo.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!msg) throw new NotFoundException('Message not found');
    if (msg.sender.id !== me.id)
      throw new ForbiddenException('You can only edit your messages');

    msg.text = newText;
    msg.updatedAt = new Date();
    return this.msgRepo.save(msg);
  }

  async deleteMessage(userId: number, messageId: number) {
    const me = await this.ensureProfile(userId);
    const msg = await this.msgRepo.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!msg) throw new NotFoundException('Message not found');
    if (msg.sender.id !== me.id)
      throw new ForbiddenException('You can only delete your messages');

    msg.isDeleted = true;
    msg.text = 'Message deleted';
    msg.mediaUrl = null;
    return this.msgRepo.save(msg);
  }

  async replyMessage(
    userId: number,
    chatId: number,
    replyToId: number,
    text: string,
  ) {
    const me = await this.ensureProfile(userId);
    const replyTo = await this.msgRepo.findOne({
      where: { id: replyToId },
      relations: ['sender'],
    });
    if (!replyTo) throw new NotFoundException('Replied message not found');

    const msg = this.msgRepo.create({
      chat: { id: chatId } as any,
      sender: me,
      text,
      replyTo,
      isDelivered: true,
    });
    const saved = await this.msgRepo.save(msg);

    // Read entry yaratish
    await this.readRepo.save(
      this.readRepo.create({ message: saved, reader: me }),
    );

    return saved;
  }

  async forwardMessage(
    userId: number,
    targetChatId: number,
    originalId: number,
  ) {
    const me = await this.ensureProfile(userId);
    const original = await this.msgRepo.findOne({ where: { id: originalId } });
    if (!original) throw new NotFoundException('Original message not found');

    const forwarded = this.msgRepo.create({
      chat: { id: targetChatId } as any,
      sender: me,
      text: original.text,
      mediaUrl: original.mediaUrl,
      mediaType: original.mediaType,
      isForwarded: true,
      isDelivered: true,
    });
    const saved = await this.msgRepo.save(forwarded);

    // Read entry yaratish
    await this.readRepo.save(
      this.readRepo.create({ message: saved, reader: me }),
    );

    return saved;
  }

  async muteChat(userId: number, chatId: number) {
    const me = await this.ensureProfile(userId);
    const part = await this.partRepo.findOne({
      where: { chat: { id: chatId }, profile: { id: me.id } },
    });
    if (!part) throw new ForbiddenException('Not a participant');

    part.isMuted = true;
    return await this.partRepo.save(part);
  }

  async unmuteChat(userId: number, chatId: number) {
    const me = await this.ensureProfile(userId);
    const part = await this.partRepo.findOne({
      where: { chat: { id: chatId }, profile: { id: me.id } },
    });
    if (!part) throw new ForbiddenException('Not a participant');

    part.isMuted = false;
    return await this.partRepo.save(part);
  }

  async addParticipant(userId: number, chatId: number, profileIds: number[]) {
    const me = await this.ensureProfile(userId);
    const chat = await this.chatRepo.findOne({
      where: { id: chatId, isGroup: true },
      relations: ['participants', 'participants.profile'],
    });
    if (!chat) throw new NotFoundException('Group chat not found');

    const isAdmin = chat.participants.some(
      (p) => p.profile.id === me.id && p.isAdmin,
    );
    if (!isAdmin)
      throw new ForbiddenException('Only admins can add participants');

    const profiles = await this.profileRepo.findByIds(profileIds);
    const newParticipants = profiles
      .filter((p) => !chat.participants.some((cp) => cp.profile.id === p.id))
      .map((p) => this.partRepo.create({ chat, profile: p }));

    await this.partRepo.save(newParticipants);
    return { message: 'Participants added', count: newParticipants.length };
  }

  async leaveChat(userId: number, chatId: number) {
    const me = await this.ensureProfile(userId);
    const part = await this.partRepo.findOne({
      where: { chat: { id: chatId }, profile: { id: me.id } },
    });
    if (!part) throw new ForbiddenException('Not a participant');

    await this.partRepo.remove(part);
    return { message: 'Left chat successfully' };
  }
  async deleteChat(userId: number, chatId: number) {
    const me = await this.ensureProfile(userId);

    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
      relations: ['participants', 'participants.profile'],
    });

    if (!chat) throw new NotFoundException('Chat not found');

    if (chat.isGroup) {
      const isAdmin = chat.participants.some((p) => p.profile?.id === me.id);
      if (!isAdmin)
        throw new ForbiddenException('Only admins can delete group chats');
    }

    // Direct chat yoki admin bo'lgan group chatni o'chiramiz
    await this.chatRepo.remove(chat);
    return { message: 'Chat deleted successfully' };
  }
}
