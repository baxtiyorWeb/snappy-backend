import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ChatEntity } from "./chat.entity";
import { ProfileEntity } from "../../profile/entities/profile.entity";
import { MessageReadEntity } from "./message-read.entity";

@Entity("messages")
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChatEntity, (chat) => chat.messages, { onDelete: "CASCADE" })
  chat: ChatEntity;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  sender: ProfileEntity;

  @Column({ type: "text", nullable: true })
  text: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  mediaUrl: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  mediaType: "image" | "video" | "audio" | null;

  @ManyToOne(() => MessageEntity, (m) => m.replies, { nullable: true })
  replyTo: MessageEntity | null;

  @OneToMany(() => MessageEntity, (m) => m.replyTo)
  replies: MessageEntity[];

  @Column({ type: "boolean", default: false })
  isForwarded: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @OneToMany(() => MessageReadEntity, (r) => r.message)
  reads: MessageReadEntity[];

  @Column({ default: false })
  isDelivered: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
