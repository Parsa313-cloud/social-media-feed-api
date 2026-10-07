import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';
import { GetPostsDto } from './dto/get-posts.dto';
import { PostRateLimitGuard } from './guards/post-rate-limit.guard';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PostRateLimitGuard)
  @ApiBearerAuth()
    create(
      @Request() req: any,
      @Body() dto: CreatePostDto,
    ) {
      return this.postsService.create(req.user.id, dto);
    }
  @Get(':postId')
    getPost(
      @Param('postId', ParseIntPipe) postId: number,
      @Query() query: GetPostsDto,
    ) {
      return this.postsService.findOne(
        postId,
        query.page,
        query.limit,
      );
    }
  @Get()
  getPosts(@Query() query: GetPostsDto) {
    return this.postsService.findAll(
      query.page,
      query.limit,
    );
  }
}