import { IsString, IsOptional, MinLength, IsInt, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateProfileDto {
  @ApiProperty({
    required: false,
    example: "John Updated",
    description: "Full name",
  })
  @IsOptional()
  @IsString()
  fullName?: string;
  
  @ApiProperty({
    required: false,
    example: "https://example.com/avatar.jpg",
    description: "Profile picture URL",
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    required: false,
    example: "08099887766",
    description: "Phone number",
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    required: false,
    example: "12345678901",
    description: "National Identification Number (NIN)",
  })
  @IsOptional()
  @IsString()
  nin?: string;

  @ApiProperty({
    required: false,
    example: "12345678901",
    description: "Bank Verification Number (BVN)",
  })
  @IsOptional()
  @IsString()
  bvn?: string;

  @ApiProperty({
    required: false,
    example: "GTBank",
    description: "Bank name for withdrawals",
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({
    required: false,
    example: "0123456789",
    description: "Bank account number",
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({
    required: false,
    example: "John Doe",
    description: "Bank account name",
  })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({
    required: false,
    example: "https://example.com/id-card.jpg",
    description: "URL of the uploaded KYC document",
  })
  @IsOptional()
  @IsString()
  kycDocumentUrl?: string;

  @ApiProperty({
    required: false,
    example: "newPassword123",
    description: "New password (minimum 6 characters)",
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    required: false,
    example: 10,
    description: "Daily lead target (Agent only)",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLeadTarget?: number;

  @ApiProperty({
    required: false,
    example: 20,
    description: "Monthly conversion target (Agent only)",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyConversionTarget?: number;
}
