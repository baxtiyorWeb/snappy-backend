import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn
} from "typeorm";
import { ParticipantEntity } from "./participant.entity";
import { MessageEntity } from "./message.entity";

@Entity("chats")
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // 1-to-1 yoki guruh
  @Column({ default: false })
  isGroup: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  title: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  avatar: string | null;

  // DM uchun unique key (2 foydalanuvchi uchun)
  @Column({ type: "varchar", length: 50, nullable: true, unique: true })
  dmKey: string | null;

  @OneToMany(() => ParticipantEntity, (p) => p.chat)
  participants: ParticipantEntity[];

  @OneToMany(() => MessageEntity, (m) => m.chat)
  messages: MessageEntity[];



  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
