import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

  ) { }

  async savePlayerId(userId: number, playerId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.onesignal_player_ids = user.onesignal_player_ids || [];
    if (!user.onesignal_player_ids.includes(playerId)) {
      user.onesignal_player_ids.push(playerId);
      await this.userRepo.save(user);
    }

    return user;
  }




  async addOneSignalId(userId: number, playerId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.onesignal_player_ids) user.onesignal_player_ids = [];
    if (!user.onesignal_player_ids.includes(playerId)) {
      user.onesignal_player_ids.push(playerId);
      await this.userRepo.save(user);
    }
  }

  async findAllUsers() {
    try {
      return await this.userRepo.find({ relations: ['profile'] });
    } catch (error) {
      console.error('Database error:', error);
      throw new InternalServerErrorException('Foydalanuvchilarni olishda xatolik yuz berdi');
    }
  }

  async findById(id: number) {
    try {
      const existUser = await this.userRepo.findOneBy({ id });
      console.log(existUser, id);

      if (!existUser) {
        throw new NotFoundException('User not found');
      }
      return existUser;
    } catch (error) {
      throw new InternalServerErrorException('Foydalanuvchini olishda xatolik yuz berdi');
    }
  }

  async updateUser(id: number, data: Partial<UserEntity>) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, data);
    try {
      return await this.userRepo.save(user);
    } catch (error) {
      console.error('Update error:', error);
      throw new InternalServerErrorException('Foydalanuvchini yangilashda xatolik yuz berdi');
    }
  }

  async replaceUser(id: number, data: UserEntity) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.userRepo.update(id, data);
      return await this.userRepo.findOneBy({ id });
    } catch (error) {
      throw new InternalServerErrorException('Foydalanuvchini yangilashda xatolik yuz berdi');
    }
  }

  async deleteUser(id: number) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.userRepo.delete(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Foydalanuvchini o‘chirishda xatolik yuz berdi');
    }
  }
}
