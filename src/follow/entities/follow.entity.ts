import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { UserEntity } from "../../users/entities/user.entity";

@Entity("follows")
export class FollowEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Kuzatuvchi foydalanuvchi
  @ManyToOne(() => UserEntity, (user) => user.following, { onDelete: "CASCADE" })
  follower: UserEntity;

  // Kuzatilayotgan foydalanuvchi
  @ManyToOne(() => UserEntity, (user) => user.followers, { onDelete: "CASCADE" })
  following: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
