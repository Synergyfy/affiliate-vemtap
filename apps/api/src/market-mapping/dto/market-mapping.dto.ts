import { IsString, IsOptional, IsInt, Min, IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMissionPlanDto {
  @ApiProperty({ example: 20, description: "Target visits for mission" })
  @IsInt()
  @Min(0)
  targetVisits: number;

  @ApiProperty({ example: 5, description: "Target leads for mission" })
  @IsInt()
  @Min(0)
  targetLeads: number;

  @ApiProperty({ example: 2, description: "Target conversions for mission" })
  @IsInt()
  @Min(0)
  targetConversions: number;

  @ApiProperty({ required: false, example: "Ikeja Cluster A", description: "Location or cluster name" })
  @IsOptional()
  @IsString()
  locationCluster?: string;

  @ApiProperty({ required: false, example: "Focusing on retail sector", description: "Notes or plan details" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, example: "2026-08-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, example: "2026-08-31T23:59:59.000Z" })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateMissionPlanDto {
  @ApiProperty({ required: false, example: 25 })
  @IsOptional()
  @IsInt()
  @Min(0)
  targetVisits?: number;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  targetLeads?: number;

  @ApiProperty({ required: false, example: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  targetConversions?: number;

  @ApiProperty({ required: false, example: "COMPLETED" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, example: "Updated target note" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMarketMappingNoteDto {
  @ApiProperty({ required: false, description: "Business ID" })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiProperty({ required: false, description: "Lead ID" })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ example: "Ace Electronics", description: "Business name" })
  @IsString()
  businessName: string;

  @ApiProperty({ example: "Visited manager, interested in starter plan.", description: "Note content" })
  @IsString()
  content: string;

  @ApiProperty({ required: false, example: "2026-08-10T10:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
