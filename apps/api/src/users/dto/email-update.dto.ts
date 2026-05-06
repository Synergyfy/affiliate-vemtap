import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RequestEmailUpdateDto {
  @ApiProperty({ example: 'new.email@example.com' })
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;
}

export class VerifyEmailUpdateDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
