import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
  Unique,
} from 'typeorm';
import { MessageEntity } from './message.entity';
import { ProfileEntity } from '../../profile/entities/profile.entity';

@Entity('message_reads')
@Unique(['message', 'reader']) // Bir user bir xabarni faqat bir marta o'qiydi
@Index(['message', 'reader']) // Tez qidirish
export class MessageReadEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MessageEntity, (message) => message.reads, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'messageId' })
  @Index()
  message: MessageEntity;

  @ManyToOne(() => ProfileEntity, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'readerId' })
  @Index()
  reader: ProfileEntity;

  @CreateDateColumn()
  @Index() // O'qilgan vaqt bo'yicha tartiblash
  readAt: Date;
}
