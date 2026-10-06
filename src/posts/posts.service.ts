import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        authorId: userId,
        content: dto.content,
        contentType: dto.contentType,
        caption: dto.caption,
      },
    });
  }
  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [posts, totalItems] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: limit,

        orderBy: {
          createdAt: 'desc',
        },

        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },

          _count: {
            select: {
              comments: true,
            },
          },

          comments: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,

            select: {
              text: true,
              createdAt: true,

              author: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.post.count(),
    ]);

  const items = posts.map((post) => ({
      id: post.id,
      content: post.content,
      contentType: post.contentType,
      caption: post.caption,
      createdAt: post.createdAt,

      author: post.author,

      totalComments: post._count.comments,

      latestComment: post.comments[0] ?? null,
    }));

    return {
      items,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
      },
    };
  }
  async findOne(
    postId: number,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const [comments, totalItems] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          parentCommentId: null,
        },

        skip,
        take: limit,

        orderBy: {
          createdAt: 'asc',
        },

        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },

          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),

      this.prisma.comment.count({
        where: {
          postId,
          parentCommentId: null,
        },
      }),
    ]);

    return {
      id: post.id,
      content: post.content,
      contentType: post.contentType,
      caption: post.caption,
      createdAt: post.createdAt,

      author: post.author,

      comments: comments.map((comment) => ({
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        author: comment.author,
        totalReplies: comment._count.replies,
      })),

      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
      },
    };
  }

}