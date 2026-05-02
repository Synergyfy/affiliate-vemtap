import { ApiProperty } from '@nestjs/swagger';
import { ToolType } from '@prisma/client';

export class ToolResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ToolType })
  type: ToolType;

  @ApiProperty()
  content: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedToolResponseDto {
  @ApiProperty({ type: [ToolResponseDto] })
  data: ToolResponseDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
