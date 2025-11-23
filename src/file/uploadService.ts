// src/file/upload.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { put, del } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {

  // Multer orqali kelgan fayl
  async uploadFile(file: Express.Multer.File, type?: string): Promise<string> {
    try {
      const fileName = `${type || 'file'}/${Date.now()}-${Math.random().toString(36).substring(2)}-${file.originalname}`;
      const blob = await put(fileName, file.buffer, {
        access: 'public',
        addRandomSuffix: false,
      });

      return blob.url;
    } catch (error) {
      console.error('Vercel Blob yuklashda xatolik:', error);
      throw new InternalServerErrorException('Vercel Blob-ga fayl yuklashda muammo yuz berdi!');
    }
  }

  // Path orqali upload (JSON, PDF, boshqa static fayllar)
  async uploadFileFromPath(filePath: string, type?: string): Promise<string> {
    try {
      const buffer = fs.readFileSync(filePath);
      const fileName = `${type || 'file'}/${Date.now()}-${Math.random().toString(36).substring(2)}-${path.basename(filePath)}`;

      const blob = await put(fileName, buffer, {
        access: 'public',
        addRandomSuffix: false,
      });

      return blob.url;
    } catch (error) {
      console.error('Vercel Blob path upload xatoligi:', error);
      throw new InternalServerErrorException('Vercel Blob-ga fayl yuklashda muammo yuz berdi!');
    }
  }

  // Faylni o'chirish
  async deleteFile(url: string): Promise<void> {
    try {
      await del(url);
    } catch (error) {
      console.error('Vercel Blob delete xatoligi:', error);
      throw new InternalServerErrorException('Vercel Blob-dan fayl o\'chirishda muammo yuz berdi!');
    }
  }
}