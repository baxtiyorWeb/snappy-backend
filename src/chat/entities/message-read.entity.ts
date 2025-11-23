import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from "typeorm";
import { MessageEntity } from "./message.entity";
import { ProfileEntity } from "../../profile/entities/profile.entity";

@Entity("message_reads")
@Unique(["message", "reader"])
export class MessageReadEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MessageEntity, (msg) => msg.reads, { onDelete: "CASCADE" })
  message: MessageEntity;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  reader: ProfileEntity;

  @CreateDateColumn()
  readAt: Date;
}
