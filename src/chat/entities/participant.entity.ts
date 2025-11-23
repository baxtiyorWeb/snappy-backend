import {
  Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn
} from "typeorm";
import { ChatEntity } from "./chat.entity";
import { ProfileEntity } from "../../profile/entities/profile.entity";

@Entity("chat_participants")
export class ParticipantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChatEntity, (chat) => chat.participants, { onDelete: "CASCADE" })
  chat: ChatEntity;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  profile: ProfileEntity;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isMuted: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastReadAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
