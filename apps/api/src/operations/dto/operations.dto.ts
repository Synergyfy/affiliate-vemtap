import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { Priority, TaskStatus, DemoStatus, OnboardingStage, OnboardingStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class CreateDemoDto {
  @IsString()
  businessName: string;

  @IsUUID()
  @IsOptional()
  leadId?: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  meetingUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  agentId?: string;
}

export class UpdateDemoDto {
  @IsEnum(DemoStatus)
  @IsOptional()
  status?: DemoStatus;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  meetingUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateOnboardingDto {
  @IsEnum(OnboardingStage)
  @IsOptional()
  stage?: OnboardingStage;

  @IsEnum(OnboardingStatus)
  @IsOptional()
  status?: OnboardingStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
