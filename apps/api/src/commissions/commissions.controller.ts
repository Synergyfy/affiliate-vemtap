import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiResponse,
} from "@nestjs/swagger";
import { CommissionsService } from "./commissions.service";
import {
  PaginatedCommissionResponseDto,
} from "./dto/commission-response.dto";
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
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
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
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get commission statistics for the current user" })
  @ApiResponse({
    status: 200,
    description: "Commission statistics",
  })
  getStats(@CurrentUser() user: { id: string }) {
    return this.commissionsService.getStats(user.id);
  }

  @Get("admin/stats")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get global commission stats (Admin only)" })
  getGlobalStats() {
    return this.commissionsService.getGlobalStats();
  }

  @Get("export")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Export commissions as CSV (Admin only)" })
  async exportCsv(@Res() res: Response) {
    const csv = await this.commissionsService.exportCsv();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=commissions.csv");
    return res.status(200).send(csv);
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
  updateStatus(
    @Param("id") id: string,
    @Body() data: { status: CommissionStatus },
  ) {
    return this.commissionsService.updateStatus(id, data);
  }
}

