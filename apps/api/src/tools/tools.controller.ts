import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { ToolsService } from "./tools.service";
import { CreateToolDto, UpdateToolDto } from "./dto/tool.dto";
import {
  ToolResponseDto,
  PaginatedToolResponseDto,
} from "./dto/tool-response.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("tools")
@ApiBearerAuth("JWT")
@Controller("tools")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @ApiOperation({ summary: "Get all published marketing tools" })
  @ApiOkResponse({ type: PaginatedToolResponseDto })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query("all") all?: string,
  ) {
    const { data, total } = await this.toolsService.findAll(!all, {
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

  @Get(":id")
  @ApiOperation({ summary: "Get a single tool by ID" })
  @ApiOkResponse({ type: ToolResponseDto })
  @ApiResponse({ status: 404, description: "Tool not found" })
  findOne(@Param("id") id: string) {
    return this.toolsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a new marketing tool (Admin only)" })
  @ApiBody({
    type: CreateToolDto,
    description: "Tool details",
    examples: {
      flyer: {
        value: {
          title: "Summer Promo Flyer",
          description: "Flyer for summer campaign",
          type: "FLYER",
          category: "Social Media",
          content: "https://storage.example.com/flyer.jpg",
          isPublished: true,
        },
      },
      copyTemplate: {
        value: {
          title: "WhatsApp Script",
          type: "COPY_TEMPLATE",
          content: "Hi! Check out Vemtap...",
        },
      },
    },
  })
  @ApiOkResponse({ type: ToolResponseDto })
  create(@Body() dto: CreateToolDto) {
    return this.toolsService.create(dto);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update a tool (Admin only)" })
  @ApiBody({
    type: UpdateToolDto,
    description: "Fields to update",
    examples: {
      default: { value: { title: "Updated Title", isPublished: true } },
    },
  })
  @ApiResponse({ status: 200, description: "Tool updated successfully" })
  @ApiResponse({ status: 404, description: "Tool not found" })
  update(@Param("id") id: string, @Body() dto: UpdateToolDto) {
    return this.toolsService.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Delete a tool (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Tool deleted successfully",
    example: { message: "Tool deleted" },
  })
  @ApiResponse({ status: 404, description: "Tool not found" })
  remove(@Param("id") id: string) {
    return this.toolsService.remove(id);
  }
}
