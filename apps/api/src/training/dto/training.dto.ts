import { IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProgressStatus } from '@prisma/client';

class QuizDto {
  @ApiProperty()
  @IsString()
  question: string;

  @ApiProperty()
  @IsArray()
  options: string[];

  @ApiProperty()
  @IsInt()
  correctAnswer: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty()
  @IsInt()
  order: number;
}

class ScenarioDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  situation: string;

  @ApiProperty()
  @IsString()
  objection: string;

  @ApiProperty()
  @IsString()
  idealResponse: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  correctAnswerIndex?: number;

  @ApiProperty()
  @IsInt()
  order: number;
}

export class CreateTrainingModuleDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @ApiProperty()
  @IsInt()
  order: number;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ type: [QuizDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizDto)
  quizzes?: QuizDto[];

  @ApiProperty({ type: [ScenarioDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScenarioDto)
  scenarios?: ScenarioDto[];
}

import { PartialType } from '@nestjs/swagger';

export class UpdateTrainingModuleDto extends PartialType(CreateTrainingModuleDto) {}

export class UpdateTrainingProgressDto {
  @ApiProperty({ enum: ProgressStatus })
  @IsEnum(ProgressStatus)
  status: ProgressStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  quizScore?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  completedAt?: Date;
}
