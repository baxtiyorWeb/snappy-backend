import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Put,
  Delete,
  Body,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Post,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/jwt-strategy/jwt-guards';
import { ApiBearerAuth } from '@nestjs/swagger';


@ApiBearerAuth()
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)

export class UsersController {
  constructor(private readonly userService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Post('onesignal')
  async savePlayerId(@Req() req, @Body('playerId') playerId: string) {
    const userId = req.user?.sub;
    if (!playerId) throw new BadRequestException('Player ID kiritilmadi');
    const user = await this.userService.savePlayerId(userId, playerId);
    return {
      message: '✅ Player ID saqlandi',
      playerIds: user.onesignal_player_ids,
    };
  }


  @Post('save-onesignal-id')
  async saveOneSignalId(@Body() { playerId }: { playerId: string }, @Req() req) {
    const userId = req.user.sub;
    await this.userService.addOneSignalId(userId, playerId);
    return { success: true };
  }
  @Get('/')
  async findAllUsers() {
    try {
      const users = await this.userService.findAllUsers();
      return users;
    } catch (error) {
      console.error('Error loading users:', error);
      throw new InternalServerErrorException('Users not loaded');
    }
  }

  @Get('/:id')
  async findByIdUser(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.userService.findById(id);
      if (!user) {
        throw new NotFoundException(`User not found: ${id}`);
      }
      return user;
    } catch (error) {
      console.error('Error loading user:', error);
      throw new BadRequestException('User not loaded');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    try {
      return await this.userService.updateUser(id, data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new InternalServerErrorException('User not updated');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  async replaceUser(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    try {
      return await this.userService.replaceUser(id, data);
    } catch (error) {
      console.error('Error replacing user:', error);
      throw new InternalServerErrorException('User not replaced');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.userService.deleteUser(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new InternalServerErrorException('User not deleted');
    }
  }
}
