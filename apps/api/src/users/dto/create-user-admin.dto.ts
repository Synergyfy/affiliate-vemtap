import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserAdminDto {
  @ApiProperty({ example: 'Jane Marketer', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'jane@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '08012345678', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'securePassword123', description: 'Password (min 8 chars)', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: Role, default: Role.AGENT, required: false, description: 'User role (default: AGENT)' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: 10, required: false, description: 'Daily lead target count' })
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLeadTarget?: number;

  @ApiProperty({ example: 20, required: false, description: 'Monthly conversion (signup+plan) target count' })
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyConversionTarget?: number;

  @ApiProperty({ required: false, description: 'Supervisor user ID' })
  @IsOptional()
  @IsString()
  supervisorId?: string;

  @ApiProperty({ required: false, description: 'Manager user ID' })
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiProperty({ required: false, type: [String], example: ['MON', 'TUE', 'WED', 'THU', 'FRI'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workingDays?: string[];
}
