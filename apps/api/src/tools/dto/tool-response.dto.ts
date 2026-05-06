import { ApiProperty } from "@nestjs/swagger";
import { ToolType } from "@prisma/client";

export class ToolResponseDto {
  @ApiProperty({ description: "Unique tool identifier", example: "tool-uuid" })
  id: string;

  @ApiProperty({ description: "Tool title", example: "Summer Promo Flyer" })
  title: string;

  @ApiProperty({
    enum: ToolType,
    description: "Type of marketing tool",
    example: ToolType.BANNER,
  })
  type: ToolType;

  @ApiProperty({
    description: "Tool content (URL or text)",
    example: "https://storage.example.com/flyer.jpg",
  })
  content: string;

  @ApiProperty({ description: "Tool category", example: "Social Media" })
  category: string;

  @ApiProperty({
    description: "Whether the tool is visible to affiliates",
    example: true,
  })
  isPublished: boolean;

  @ApiProperty({
    description: "Creation date",
    example: "2026-05-01T10:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update date",
    example: "2026-05-05T14:00:00.000Z",
  })
  updatedAt: Date;
}

export class PaginatedToolResponseDto {
  @ApiProperty({
    type: [ToolResponseDto],
    description: "Array of tool objects",
  })
  data: ToolResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
    example: { total: 25, page: 1, limit: 10, totalPages: 3 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
