import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'Hello world!',
    description: 'Post content',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200,{message: 'Post content must be between 1 and 200 characters long'})
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
  @MaxLength(200, {message: 'Post caption must be between 1 and 200 characters long'})
  caption?: string;
}