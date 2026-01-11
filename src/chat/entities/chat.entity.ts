import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MessageEntity } from './message.entity';
import { ParticipantEntity } from './participant.entity';

@Entity('chats')
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean', default: false })
  isGroup: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // DM (Direct Message) uchun unique key
  // Format: "profileId1-profileId2" (kichikdan kattaga)
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  @Index() // Tez qidirish uchun
  dmKey: string | null;

  @OneToMany(() => MessageEntity, (message) => message.chat, {
    cascade: true,
  })
  messages: MessageEntity[];

  @OneToMany(() => ParticipantEntity, (participant) => participant.chat, {
    cascade: true,
  })
  participants: ParticipantEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields (database'da saqlanmaydi)
  lastMessage?: MessageEntity;
  unreadCount?: number;
  participantCount?: number;
}
