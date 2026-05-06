import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "John Doe", description: "Full name of the user" })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: "john@example.com",
    description: "Email address for the account",
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "08012345678", description: "Phone number" })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: "securePassword123",
    description: "Password (minimum 8 characters)",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: "VEM-ABC123",
    description: "Referral code of the affiliate who referred this user",
    required: false,
  })
  @IsString()
  @IsOptional()
  referralCode?: string;
}
