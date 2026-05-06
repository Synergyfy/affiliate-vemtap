import { ApiProperty } from "@nestjs/swagger";
import { Role, UserStatus, KycStatus } from "@prisma/client";

export class UserResponseDto {
  @ApiProperty({
    description: "Unique user identifier",
    example: "uuid-string",
  })
  id: string;

  @ApiProperty({
    description: "User email address",
    example: "john@example.com",
  })
  email: string;

  @ApiProperty({ description: "User phone number", example: "08012345678" })
  phone: string;

  @ApiProperty({ description: "Full name", example: "John Doe" })
  fullName: string;

  @ApiProperty({
    enum: Role,
    description: "User role in the system",
    example: Role.AFFILIATE,
  })
  role: Role;

  @ApiProperty({
    enum: UserStatus,
    description: "Current account status",
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    enum: KycStatus,
    description: "KYC verification status",
    example: KycStatus.VERIFIED,
  })
  kycStatus: KycStatus;

  @ApiProperty({ description: "Unique referral code", example: "VEM-XYZ789" })
  referralCode: string;

  @ApiProperty({
    description: "Account creation date",
    example: "2026-01-15T10:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({ description: "Total earnings in kobo", example: 125000 })
  totalEarnings: number;
}

export class PaginatedUserResponseDto {
  @ApiProperty({
    type: [UserResponseDto],
    description: "Array of user objects",
  })
  data: UserResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
    example: { total: 150, page: 1, limit: 10, totalPages: 15 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
