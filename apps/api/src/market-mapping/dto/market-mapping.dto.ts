import { IsString, IsOptional, IsInt, Min, IsDateString, IsBoolean, IsArray, IsIn } from "class-validator";
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

export class CreateMarketMappingVisitDto {
  @IsString()
  name: string;

  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsIn(["NOT_YET", "VISITED", "CONTACTED", "INTERESTED", "NOT_INTERESTED", "CUSTOMER"]) status?: string;
  @IsOptional() @IsBoolean() isPlaceholder?: boolean;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() exactAddress?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsString() contactPosition?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() horizon?: string;
  @IsOptional() @IsString() dailyCustomers?: string;
  @IsOptional() @IsString() businessSize?: string;
  @IsOptional() @IsString() openingHours?: string;
  @IsOptional() @IsArray() openingDays?: string[];
  @IsOptional() @IsString() gpsLat?: string;
  @IsOptional() @IsString() gpsLng?: string;
  @IsOptional() @IsString() gpsAddress?: string;
  @IsOptional() @IsString() nextVisitDate?: string;
  @IsOptional() @IsString() nextVisitTime?: string;
  @IsOptional() @IsBoolean() decisionMakerMet?: boolean;
  @IsOptional() @IsString() interested?: string;
  @IsOptional() @IsBoolean() demoDone?: boolean;
  @IsOptional() @IsString() visitNotes?: string;
  @IsOptional() @IsBoolean() isAnchor?: boolean;
  @IsOptional() @IsString() planId?: string;
}

export class UpdateMarketMappingVisitDto extends CreateMarketMappingVisitDto { }

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

  @ApiProperty({ required: false, example: "Ikeja Cluster A", description: "Location or cluster name" })
  @IsOptional()
  @IsString()
  locationCluster?: string;

  @ApiProperty({ required: false, example: "2026-08-10T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, example: "2026-08-16T23:59:59.000Z" })
  @IsOptional()
  @IsDateString()
  endDate?: string;
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reportKey?: string;

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

export class CreateHierarchyNodeDto {
  @ApiProperty({ example: "Lagos" })
  @IsString()
  name: string;

  @ApiProperty({ example: "STATE", enum: ["COUNTRY", "STATE", "CITY", "AREA", "CLUSTER"] })
  @IsString()
  type: "COUNTRY" | "STATE" | "CITY" | "AREA" | "CLUSTER";

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateHierarchyNodeDto {
  @ApiProperty({ required: false, example: "Lagos Mainland" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export enum AssignmentDurationEnum {
  ONE_DAY = "ONE_DAY",
  ONE_WEEK = "ONE_WEEK",
  ONE_MONTH = "ONE_MONTH",
  CUSTOM = "CUSTOM",
  FOREVER = "FOREVER",
}

export class CreateAssignmentDto {
  @ApiProperty({ example: "uuid-user-id" })
  @IsString()
  userId: string;

  @ApiProperty({ example: "uuid-cluster-id" })
  @IsString()
  clusterId: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  dailyLeadTarget: number;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(0)
  weeklyLeadTarget: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(0)
  monthlyConversionTarget: number;

  @ApiProperty({ example: true })
  @IsOptional()
  allowUserEdit?: boolean;

  @ApiProperty({ required: false, enum: ["ONE_DAY", "ONE_WEEK", "ONE_MONTH", "CUSTOM", "FOREVER"], example: "ONE_WEEK" })
  @IsOptional()
  @IsIn(["ONE_DAY", "ONE_WEEK", "ONE_MONTH", "CUSTOM", "FOREVER"])
  duration?: "ONE_DAY" | "ONE_WEEK" | "ONE_MONTH" | "CUSTOM" | "FOREVER";

  @ApiProperty({ required: false, example: "2026-09-01T00:00:00.000Z", description: "Required if duration is CUSTOM" })
  @IsOptional()
  @IsDateString()
  customExpiresAt?: string;

  @ApiProperty({ required: false, example: 14, description: "Alternative to customExpiresAt: number of days from now" })
  @IsOptional()
  @IsInt()
  @Min(1)
  customDays?: number;

  @ApiProperty({ required: false, example: true, description: "Whether to replace any active existing cluster assignment for this user" })
  @IsOptional()
  @IsBoolean()
  reassignExisting?: boolean;
}

export class AssignLineManagerDto {
  @ApiProperty({ example: "uuid-manager-id", description: "User ID of the Line Manager" })
  @IsString()
  managerId: string;

  @ApiProperty({ example: "uuid-cluster-id" })
  @IsString()
  clusterId: string;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLeadTarget?: number;

  @ApiProperty({ required: false, example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  weeklyLeadTarget?: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyConversionTarget?: number;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  allowUserEdit?: boolean;

  @ApiProperty({ required: false, enum: ["ONE_DAY", "ONE_WEEK", "ONE_MONTH", "CUSTOM", "FOREVER"], example: "ONE_WEEK" })
  @IsOptional()
  @IsIn(["ONE_DAY", "ONE_WEEK", "ONE_MONTH", "CUSTOM", "FOREVER"])
  duration?: "ONE_DAY" | "ONE_WEEK" | "ONE_MONTH" | "CUSTOM" | "FOREVER";

  @ApiProperty({ required: false, example: "2026-09-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  customExpiresAt?: string;

  @ApiProperty({ required: false, example: 14 })
  @IsOptional()
  @IsInt()
  @Min(1)
  customDays?: number;

  @ApiProperty({ required: false, example: true, description: "Automatically include all affiliates/agents under this line manager" })
  @IsOptional()
  @IsBoolean()
  includeTeamMembers?: boolean;

  @ApiProperty({ required: false, example: true, description: "Whether to replace active cluster assignments for team members" })
  @IsOptional()
  @IsBoolean()
  reassignExisting?: boolean;
}

export class UpdateAssignmentDto {
  @ApiProperty({ required: false, example: "uuid-cluster-id", description: "Intentionally reassign to a new cluster" })
  @IsOptional()
  @IsString()
  clusterId?: string;

  @ApiProperty({ required: false, example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLeadTarget?: number;

  @ApiProperty({ required: false, example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  weeklyLeadTarget?: number;

  @ApiProperty({ required: false, example: 25 })
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyConversionTarget?: number;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  allowUserEdit?: boolean;

  @ApiProperty({ required: false, enum: ["ONE_DAY", "ONE_WEEK", "ONE_MONTH", "CUSTOM", "FOREVER"], example: "ONE_MONTH" })
  @IsOptional()
  @IsIn(["ONE_DAY", "ONE_WEEK", "ONE_MONTH", "CUSTOM", "FOREVER"])
  duration?: "ONE_DAY" | "ONE_WEEK" | "ONE_MONTH" | "CUSTOM" | "FOREVER";

  @ApiProperty({ required: false, example: "2026-09-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  customExpiresAt?: string;

  @ApiProperty({ required: false, example: 14 })
  @IsOptional()
  @IsInt()
  @Min(1)
  customDays?: number;
}

export class ReassignAssignmentDto {
  @ApiProperty({ example: "uuid-new-cluster-id" })
  @IsString()
  clusterId: string;

  @ApiProperty({ required: false, enum: ["ONE_DAY", "ONE_WEEK", "ONE_MONTH", "CUSTOM", "FOREVER"], example: "ONE_WEEK" })
  @IsOptional()
  @IsIn(["ONE_DAY", "ONE_WEEK", "ONE_MONTH", "CUSTOM", "FOREVER"])
  duration?: "ONE_DAY" | "ONE_WEEK" | "ONE_MONTH" | "CUSTOM" | "FOREVER";

  @ApiProperty({ required: false, example: "2026-09-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  customExpiresAt?: string;

  @ApiProperty({ required: false, example: 14 })
  @IsOptional()
  @IsInt()
  @Min(1)
  customDays?: number;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLeadTarget?: number;

  @ApiProperty({ required: false, example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  weeklyLeadTarget?: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyConversionTarget?: number;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  allowUserEdit?: boolean;
}

export class UpdateMarketMappingAdminConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  pipelineStatuses?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  categories?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  fieldDefaults?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  openingDays?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  customerRanges?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  businessSizes?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  contactPositions?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  interestOptions?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  planTypes?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  faqs?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  ticketStatuses?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  businessStatuses?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  paymentStatuses?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  dailyTarget?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  weeklyTarget?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  monthlyTarget?: number;
}
