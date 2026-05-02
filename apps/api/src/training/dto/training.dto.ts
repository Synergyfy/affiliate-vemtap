import { IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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

export class UpdateTrainingModuleDto extends CreateTrainingModuleDto {
  @IsOptional()
  title: string;
  @IsOptional()
  description: string;
  @IsOptional()
  content: string;
  @IsOptional()
  order: number;
  @IsOptional()
  category: string;
}
