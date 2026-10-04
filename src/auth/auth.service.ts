import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          { email: dto.email },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'Username or email is already in use',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  }
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
        where: {
        username: dto.username,
        },
    });

    if (!user) {
        throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(
        dto.password,
        user.passwordHash,
    );

    if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid username or password');
    }

    const payload = {
        sub: user.id,
        username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
        accessToken,
    };
  }
}


