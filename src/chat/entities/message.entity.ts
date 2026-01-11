import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { ChatEntity } from './chat.entity';
import { ProfileEntity } from '../../profile/entities/profile.entity';
import { MessageReadEntity } from './message-read.entity';

@Entity('messages')
@Index(['chat', 'createdAt']) // Chat bo'yicha xabarlarni tez qidirish
@Index(['sender', 'createdAt']) // Userning xabarlarini qidirish
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChatEntity, (chat) => chat.messages, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'chatId' })
  @Index() // Chat ID bo'yicha tez qidirish
  chat: ChatEntity;

  @ManyToOne(() => ProfileEntity, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false, // Lazy loading
  })
  @JoinColumn({ name: 'senderId' })
  @Index() // Sender ID bo'yicha qidirish
  sender: ProfileEntity;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  mediaUrl: string | null;

  @Column({
    type: 'enum',
    enum: ['image', 'video', 'audio', 'file'],
    nullable: true,
  })
  mediaType: 'image' | 'video' | 'audio' | 'file' | null;

  @ManyToOne(() => MessageEntity, (m) => m.replies, {
    nullable: true,
    onDelete: 'SET NULL', // Reply o'chirilsa, xabar qoladi
  })
  @JoinColumn({ name: 'replyToId' })
  replyTo: MessageEntity | null;

  @OneToMany(() => MessageEntity, (m) => m.replyTo)
  replies: MessageEntity[];

  @Column({ type: 'boolean', default: false })
  isForwarded: boolean;

  @Column({ type: 'boolean', default: false })
  @Index() // O'chirilgan xabarlarni filtr qilish
  isDeleted: boolean;

  @Column({ type: 'boolean', default: true })
  isDelivered: boolean;

  @OneToMany(() => MessageReadEntity, (r) => r.message, {
    cascade: true, // Read statuslarni avtomatik saqlash
  })
  reads: MessageReadEntity[];

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'int', default: 0 })
  editCount: number; // Necha marta tahrirlangan

  @CreateDateColumn()
  @Index() // Vaqt bo'yicha tartiblash
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null; // Soft delete uchun

  // Virtual fields (database'da saqlanmaydi)
  readCount?: number; // Nechta kishi o'qigan
  isRead?: boolean; // Joriy user uchun o'qilganmi
}
