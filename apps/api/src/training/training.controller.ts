import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { TrainingService } from "./training.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import {
  CreateTrainingModuleDto,
  UpdateTrainingModuleDto,
  UpdateTrainingProgressDto,
} from "./dto/training.dto";
import {
  PaginatedTrainingModuleResponseDto,
} from "./dto/training-response.dto";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("training")
@ApiBearerAuth("JWT")
@Controller("training")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get("modules")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get available training modules" })
  @ApiOkResponse({ type: PaginatedTrainingModuleResponseDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(
    @CurrentUser() user: { id: string },
    @Query() paginationDto: PaginationDto,
  ) {
    const { data, total } = await this.trainingService.findAllModulesAffiliate(
      user.id,
      {
        skip: paginationDto.skip,
        take: paginationDto.take,
      },
    );

    return {
      data,
      meta: {
        total,
        page: paginationDto.page,
        limit: paginationDto.limit,
        totalPages: Math.ceil(total / (paginationDto.limit || 10)),
      },
    };
  }

  @Patch("modules/:id/progress")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update progress for a module" })
  @ApiBody({
    type: UpdateTrainingProgressDto,
    description: "Progress update data",
    examples: {
      complete: { value: { status: "COMPLETED", quizScore: 95 } },
      inProgress: { value: { status: "IN_PROGRESS" } },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Progress updated",
    example: {
      id: "progress-uuid",
      moduleId: "module-uuid",
      userId: "user-uuid",
      status: "COMPLETED",
      quizScore: 95,
      completedAt: "2026-05-06T10:00:00.000Z",
    },
  })
  @ApiResponse({ status: 404, description: "Module not found" })
  updateProgress(
    @Param("id") moduleId: string,
    @Body() data: UpdateTrainingProgressDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.trainingService.updateProgress(user.id, moduleId, data);
  }

  @Get("admin/modules")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "List all modules for management (Admin only)" })
  @ApiOkResponse({ type: PaginatedTrainingModuleResponseDto })
  async findAllAdmin(@Query() paginationDto: PaginationDto) {
    const { data, total } = await this.trainingService.findAllModulesAdmin({
      skip: paginationDto.skip,
      take: paginationDto.take,
    });

    return {
      data,
      meta: {
        total,
        page: paginationDto.page,
        limit: paginationDto.limit,
        totalPages: Math.ceil(total / (paginationDto.limit || 10)),
      },
    };
  }

  @Get("admin/modules/:id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      "Get full module details including quizzes and scenarios (Admin only)",
  })
  @ApiOkResponse({
    description: "Full module details",
    example: {
      id: "module-uuid",
      title: "Sales Fundamentals",
      description: "Learn the basics of sales",
      content: "<h1>Welcome...</h1>",
      videoUrl: "https://video.example.com/intro",
      pdfUrl: "https://pdf.example.com/guide.pdf",
      order: 1,
      category: "Sales",
      isPublished: true,
      quizzes: [
        { question: "What is...", options: ["A", "B", "C"], correctAnswer: 0 },
      ],
      scenarios: [
        {
          title: "Customer objection",
          situation: "...",
          objection: "Too expensive",
          idealResponse: "...",
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: "Module not found" })
  findOneAdmin(@Param("id") id: string) {
    return this.trainingService.findModuleDetailsAdmin(id);
  }

  @Post("admin/modules")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a new training module (Admin only)" })
  @ApiBody({
    type: CreateTrainingModuleDto,
    description: "Training module details",
    examples: {
      default: {
        value: {
          title: "Sales Fundamentals",
          description: "Learn the basics of sales",
          content: "<h1>Welcome to the course</h1>",
          order: 1,
          category: "Sales",
          isPublished: false,
          quizzes: [
            {
              question: "What is a lead?",
              options: ["A potential customer", "A sale", "A referral"],
              correctAnswer: 0,
              order: 1,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Module created successfully",
    example: {
      id: "module-uuid",
      title: "Sales Fundamentals",
      order: 1,
      isPublished: false,
    },
  })
  createModule(@Body() dto: CreateTrainingModuleDto) {
    return this.trainingService.createModule(dto);
  }

  @Patch("admin/modules/:id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update a training module (Admin only)" })
  @ApiBody({
    type: UpdateTrainingModuleDto,
    description: "Fields to update",
    examples: {
      default: { value: { title: "Advanced Sales", isPublished: true } },
    },
  })
  @ApiResponse({ status: 200, description: "Module updated successfully" })
  @ApiResponse({ status: 404, description: "Module not found" })
  updateModule(@Param("id") id: string, @Body() dto: UpdateTrainingModuleDto) {
    return this.trainingService.updateModule(id, dto);
  }

  @Delete("admin/modules/:id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Delete a training module (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Module deleted successfully",
    example: { message: "Module deleted" },
  })
  @ApiResponse({ status: 404, description: "Module not found" })
  deleteModule(@Param("id") id: string) {
    return this.trainingService.deleteModule(id);
  }
}
