import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Great post!',
    description: 'Comment text',
  })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiPropertyOptional({
    example: 10,
    description:
      'ID of the parent comment. Leave empty to create a top-level comment.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  parentCommentId?: number;
}