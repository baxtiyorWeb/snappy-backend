// src/file/dto/file-upload.dto.ts
import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Upload qilinadigan fayl' })
  file: any;

  @ApiProperty({ required: false, description: 'Fayl turi (image, video, audio, document)' })
  @IsOptional()
  type?: string;
}
