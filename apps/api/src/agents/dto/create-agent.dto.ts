import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class CreateAgentDto {
  @ApiProperty({ example: 'Chidi Okafor' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'chidi@vemtap.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+2348022334455' })
  @IsString()
  phone: string;

  @ApiProperty({ required: false, example: 'securePassword123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ required: false, enum: UserStatus, default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ required: false, description: 'FK to parent agent (manager)' })
  @IsOptional()
  @IsString()
  managerId?: string;
}
