import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    postId: number,
    userId: number,
    dto: CreateCommentDto,
  ) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (dto.parentCommentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: {
          id: dto.parentCommentId,
        },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.postId !== postId) {
        throw new BadRequestException(
          'Parent comment does not belong to this post',
        );
      }
    }

    return this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        text: dto.text,
        parentCommentId: dto.parentCommentId,
      },
    });
  }
}