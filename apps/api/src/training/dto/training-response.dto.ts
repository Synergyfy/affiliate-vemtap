import { ApiProperty } from "@nestjs/swagger";

export class TrainingModuleResponseDto {
  @ApiProperty({
    description: "Unique module identifier",
    example: "module-uuid",
  })
  id: string;

  @ApiProperty({ description: "Module title", example: "Sales Fundamentals" })
  title: string;

  @ApiProperty({
    description: "Module description",
    example: "Learn the basics of effective sales techniques",
  })
  description: string;

  @ApiProperty({
    description: "Module content (HTML)",
    example: "<h1>Welcome to the course</h1><p>...</p>",
  })
  content: string;

  @ApiProperty({
    description: "Associated video URL",
    required: false,
    example: "https://video.example.com/intro",
  })
  videoUrl?: string;

  @ApiProperty({
    description: "Associated PDF resource URL",
    required: false,
    example: "https://pdf.example.com/guide.pdf",
  })
  pdfUrl?: string;

  @ApiProperty({ description: "Display order in the curriculum", example: 1 })
  order: number;

  @ApiProperty({ description: "Module category", example: "Sales" })
  category: string;

  @ApiProperty({
    description: "Whether the module is visible to affiliates",
    example: true,
  })
  isPublished: boolean;

  @ApiProperty({
    description: "Module creation date",
    example: "2026-05-01T10:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update date",
    example: "2026-05-05T14:00:00.000Z",
  })
  updatedAt: Date;
}

export class PaginatedTrainingModuleResponseDto {
  @ApiProperty({
    type: [TrainingModuleResponseDto],
    description: "Array of training module objects",
  })
  data: TrainingModuleResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
    example: { total: 15, page: 1, limit: 10, totalPages: 2 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
