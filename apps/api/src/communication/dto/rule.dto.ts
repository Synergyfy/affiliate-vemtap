import { IsArray, IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, Min, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AutomationAction, AutomationTrigger, CommunicationChannel } from '@prisma/client';

export class CreateAutomationRuleDto {
  @ApiProperty({ example: 'Interested first SMS follow-up' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AutomationTrigger })
  @IsEnum(AutomationTrigger)
  trigger: AutomationTrigger;

  @ApiProperty({ required: false, description: 'Optional JSON condition' })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  waitDays?: number;

  @ApiProperty({ enum: AutomationAction })
  @IsEnum(AutomationAction)
  action: AutomationAction;

  @ApiProperty({ required: false, enum: CommunicationChannel })
  @IsOptional()
  @IsEnum(CommunicationChannel)
  channel?: CommunicationChannel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateAutomationRuleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, enum: AutomationTrigger })
  @IsOptional()
  @IsEnum(AutomationTrigger)
  trigger?: AutomationTrigger;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  waitDays?: number;

  @ApiProperty({ required: false, enum: AutomationAction })
  @IsOptional()
  @IsEnum(AutomationAction)
  action?: AutomationAction;

  @ApiProperty({ required: false, enum: CommunicationChannel })
  @IsOptional()
  @IsEnum(CommunicationChannel)
  channel?: CommunicationChannel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class ReorderRulesDto {
  @ApiProperty({ type: [String], description: 'Ordered rule ids' })
  @IsArray()
  @IsUUID('4', { each: true })
  order: string[];
}
