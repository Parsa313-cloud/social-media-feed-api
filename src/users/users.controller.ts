import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get(':userId/profile')
  getProfile(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.usersService.getProfile(userId);
  }
}