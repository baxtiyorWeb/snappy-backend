import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { FileService } from './file.service';
import { UploadService } from './uploadService';
import { UploadController } from './file.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  controllers: [UploadController],
  providers: [FileService, UploadService],
  exports: [FileService, UploadService],
})
export class FileModule { }
