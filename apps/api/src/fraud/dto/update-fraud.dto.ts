import { IsEnum, IsString, IsOptional } from "class-validator";
import { FraudStatus } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateFraudStatusDto {
  @ApiProperty({
    enum: FraudStatus,
    description: "New status for the fraud alert",
    example: FraudStatus.CONFIRMED,
  })
  @IsEnum(FraudStatus)
  status: FraudStatus;

  @ApiProperty({
    required: false,
    description: "Resolution notes explaining the action taken",
    example: "Confirmed as click fraud. Account suspended.",
  })
  @IsOptional()
  @IsString()
  resolution?: string;
}
