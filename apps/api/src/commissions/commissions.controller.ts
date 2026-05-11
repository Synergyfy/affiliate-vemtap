import {
  Controller,
  Get,
  Patch,
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
import { CommissionsService } from "./commissions.service";
import {
  PaginatedCommissionResponseDto,
} from "./dto/commission-response.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { CommissionFilterDto } from "./dto/commission-filter.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role, CommissionStatus } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("commissions")
@ApiBearerAuth("JWT")
@Controller("commissions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get("me")
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get commissions for the current user" })
  @ApiOkResponse({ type: PaginatedCommissionResponseDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(
    @CurrentUser() user: { id: string },
    @Query() filterDto: CommissionFilterDto,
  ) {
    const { data, total } = await this.commissionsService.findAll(user.id, {
      skip: filterDto.skip,
      take: filterDto.take,
      status: filterDto.status,
      search: filterDto.search,
    });

    return {
      data,
      meta: {
        total,
        page: filterDto.page,
        limit: filterDto.limit,
        totalPages: Math.ceil(total / (filterDto.limit || 10)),
      },
    };
  }

  @Get("stats")
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get commission statistics for the current user" })
  @ApiResponse({
    status: 200,
    description: "Commission statistics",
    example: {
      totalCommissions: 25,
      totalEarnings: 11250,
      pendingEarnings: 2500,
      paidEarnings: 8750,
      averageCommission: 450,
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getStats(@CurrentUser() user: { id: string }) {
    return this.commissionsService.getStats(user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "List all commissions (Admin only)" })
  @ApiOkResponse({ type: PaginatedCommissionResponseDto })
  async findAllAdmin(@Query() filterDto: CommissionFilterDto) {
    const { data, total } = await this.commissionsService.findAllAdmin({
      skip: filterDto.skip,
      take: filterDto.take,
      status: filterDto.status,
      userId: filterDto.userId,
      search: filterDto.search,
    });

    return {
      data,
      meta: {
        total,
        page: filterDto.page,
        limit: filterDto.limit,
        totalPages: Math.ceil(total / (filterDto.limit || 10)),
      },
    };
  }

  @Patch(":id/status")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update commission status (Admin only)" })
  @ApiBody({
    description: "New commission status",
    examples: {
      markPaid: { value: { status: "PAID" } },
      markPending: { value: { status: "PENDING" } },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Commission status updated",
    example: {
      id: "commission-uuid",
      amount: 450,
      status: "PAID",
      paidAt: "2026-05-06T10:00:00.000Z",
    },
  })
  @ApiResponse({ status: 400, description: "Invalid status" })
  @ApiResponse({ status: 404, description: "Commission not found" })
  updateStatus(
    @Param("id") id: string,
    @Body() data: { status: CommissionStatus },
  ) {
    return this.commissionsService.updateStatus(id, data);
  }
}
