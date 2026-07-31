import {
  Controller,
  Get,
  Post,
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
import { WithdrawalsService } from "./withdrawals.service";
import {
  WithdrawalResponseDto,
  PaginatedWithdrawalResponseDto,
} from "./dto/withdrawal-response.dto";
import { WithdrawalFilterDto } from "./dto/withdrawal-filter.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role, WithdrawalStatus } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("withdrawals")
@ApiBearerAuth("JWT")
@Controller("withdrawals")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "Request a withdrawal",
    description:
      "Creates a withdrawal request from the user's available balance.",
  })
  @ApiBody({
    description: "Withdrawal amount",
    examples: { default: { value: { amount: 50000 } } },
  })
  @ApiOkResponse({
    type: WithdrawalResponseDto,
    description: "Withdrawal request created",
  })
  @ApiResponse({
    status: 400,
    description: "Insufficient balance or invalid amount",
  })
  create(
    @CurrentUser() user: { id: string },
    @Body() data: { amount: number },
  ) {
    return this.withdrawalsService.create(user.id, data.amount);
  }

  @Get("me")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get own withdrawals" })
  @ApiOkResponse({ type: PaginatedWithdrawalResponseDto })
  async findAll(
    @CurrentUser() user: { id: string },
    @Query() paginationDto: PaginationDto,
  ) {
    const { data, total } = await this.withdrawalsService.findAll(user.id, {
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

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "List all withdrawals (Admin only)" })
  @ApiOkResponse({ type: PaginatedWithdrawalResponseDto })
  async findAllAdmin(@Query() filterDto: WithdrawalFilterDto) {
    const { data, total } = await this.withdrawalsService.findAllAdmin(filterDto);

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
  @ApiOperation({ summary: "Update withdrawal status (Admin only)" })
  @ApiBody({
    description: "New withdrawal status",
    examples: {
      approve: { value: { status: "APPROVED" } },
      reject: { value: { status: "REJECTED", reason: "Insufficient balance verification" } },
      trigger: { value: { status: "TRIGGERED" } },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Withdrawal status updated",
    example: {
      id: "withdrawal-uuid",
      amount: 50000,
      status: "APPROVED",
      processedAt: "2026-05-06T10:00:00.000Z",
    },
  })
  @ApiResponse({ status: 400, description: "Invalid status or transition" })
  @ApiResponse({ status: 404, description: "Withdrawal not found" })
  updateStatus(
    @Param("id") id: string,
    @Body() data: { status: WithdrawalStatus; reason?: string },
    @CurrentUser() admin: { id: string },
  ) {
    return this.withdrawalsService.updateStatus(id, data.status, admin.id, data.reason);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Edit withdrawal amount (Admin only)" })
  @ApiBody({
    description: "New withdrawal amount",
    examples: { edit: { value: { amount: 45000 } } },
  })
  @ApiResponse({ status: 200, description: "Withdrawal amount updated" })
  @ApiResponse({ status: 400, description: "Invalid amount" })
  @ApiResponse({ status: 404, description: "Withdrawal not found" })
  updateAmount(
    @Param("id") id: string,
    @Body() data: { amount: number },
    @CurrentUser() admin: { id: string },
  ) {
    return this.withdrawalsService.updateAmount(id, data.amount, admin.id);
  }

  @Post("bulk-trigger")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "Trigger bulk end-of-month withdrawals (Admin only)",
    description:
      "Processes all approved withdrawals and changes their status to TRIGGERED.",
  })
  @ApiResponse({
    status: 201,
    description: "Bulk withdrawals triggered",
    example: { message: "25 withdrawals triggered", totalAmount: 1250000 },
  })
  triggerBulkWithdrawals(@CurrentUser() admin: { id: string }) {
    return this.withdrawalsService.triggerBulkWithdrawals(admin.id);
  }
}
