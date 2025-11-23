import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column({ nullable: true })
  mimeType: string; // image/png, video/mp4, audio/mpeg etc.

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
