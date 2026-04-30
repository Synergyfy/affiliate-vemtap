import { ApiProperty } from '@nestjs/swagger';

export class TrainingModuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ required: false })
  videoUrl?: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  category: string;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedTrainingModuleResponseDto {
  @ApiProperty({ type: [TrainingModuleResponseDto] })
  data: TrainingModuleResponseDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
