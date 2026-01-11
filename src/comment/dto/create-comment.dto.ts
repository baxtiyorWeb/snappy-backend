import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  postId: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  parentId?: number;
}