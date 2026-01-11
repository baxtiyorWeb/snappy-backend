// src/file/file.service.ts
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import { UploadService } from './uploadService';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly repo: Repository<FileEntity>,
    private readonly uploadService: UploadService,
  ) { }

  async createFile(file: Express.Multer.File): Promise<FileEntity> {
    const url = await this.uploadService.uploadFile(file);
    const entity = this.repo.create({ url, mimeType: file.mimetype });
    return this.repo.save(entity);
  }

  async getAllFiles(): Promise<FileEntity[]> {
    return this.repo.find();
  }

  async getFileById(id: number): Promise<FileEntity> {
    const file = await this.repo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('Fayl topilmadi');
    return file;
  }

  async deleteFileById(id: number): Promise<void> {
    const file = await this.getFileById(id);
    await this.uploadService.deleteFile(file.url).catch(() => { });
    await this.repo.delete(id);
  }

  async updateFile(id: number, newFile: Express.Multer.File): Promise<FileEntity> {
    const file = await this.getFileById(id);
    await this.uploadService.deleteFile(file.url).catch(() => { });
    const newUrl = await this.uploadService.uploadFile(newFile);
    file.url = newUrl;
    file.mimeType = newFile.mimetype;
    return this.repo.save(file);
  }
}