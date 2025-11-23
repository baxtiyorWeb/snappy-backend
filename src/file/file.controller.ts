// src/file/upload.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors, Get, Param, Delete, Patch } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { FileService } from './file.service';
import { FileUploadDto } from './dto/file-upload.dto';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly fileService: FileService) { }

  // ============================
  // CREATE / UPLOAD
  // ============================
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  async upload(@UploadedFile() file: Express.Multer.File) {
    const fileEntity = await this.fileService.createFile(file);
    return { message: 'Fayl muvaffaqiyatli yuklandi', file: fileEntity };
  }

  // ============================
  // READ (ALL)
  // ============================
  @Get()
  async getAllFiles() {
    return this.fileService.getAllFiles();
  }

  // ============================
  // READ (ONE)
  // ============================
  @Get(':id')
  async getFile(@Param('id') id: number) {
    return this.fileService.getFileById(id);
  }

  // ============================
  // DELETE
  // ============================
  @Delete(':id')
  async deleteFile(@Param('id') id: number) {
    await this.fileService.deleteFileById(id);
    return { message: 'Fayl o‘chirildi' };
  }

  // ============================
  // UPDATE (Faylni yangilash)
  // ============================
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  async updateFile(@Param('id') id: number, @UploadedFile() file: Express.Multer.File) {
    const updated = await this.fileService.updateFile(id, file);
    return { message: 'Fayl yangilandi', file: updated };
  }
}