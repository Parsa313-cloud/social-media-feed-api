import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'Hello world!',
    description: 'Post content',
  })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({
    example: 'text',
    description: 'Type of the post content',
  })
  @IsString()
  @MinLength(1)
  contentType: string;

  @ApiPropertyOptional({
    example: 'My first post',
    description: 'Optional post caption',
  })
  @IsOptional()
  @IsString()
  caption?: string;
}