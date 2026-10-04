import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'parsa',
    description: 'Username',
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    example: '12345678',
    description: 'User password',
  })
  @IsString()
  @MinLength(8)
  password: string;
}