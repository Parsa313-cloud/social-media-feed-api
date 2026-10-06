import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [totalPostsCreated, totalCommentsMade, posts, comments] =
      await Promise.all([
        this.prisma.post.count({
          where: {
            authorId: userId,
          },
        }),

        this.prisma.comment.count({
          where: {
            authorId: userId,
          },
        }),

        this.prisma.post.findMany({
          where: {
            authorId: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        }),

        this.prisma.comment.findMany({
          where: {
            authorId: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            text: true,
            createdAt: true,
          },
        }),
      ]);

    const recentActions = [
      ...posts.map((post) => ({
        type: 'post' as const,
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
      })),

      ...comments.map((comment) => ({
        type: 'comment' as const,
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
      })),
    ]
      .sort(
        (a, b) =>
          b.createdAt.getTime() -
          a.createdAt.getTime(),
      )
      .slice(0, 5);

    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      total_posts_created: totalPostsCreated,
      total_comments_made: totalCommentsMade,
      recent_actions: recentActions,
    };
  }
}