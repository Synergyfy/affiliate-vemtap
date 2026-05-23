import {
  Controller,
  Get,
  Patch,
  Post,
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
  ApiQuery,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateUserStatusDto, UpdateKycDto } from "./dto/admin-user.dto";
import { CreateUserAdminDto } from "./dto/create-user-admin.dto";
import {
  UserResponseDto,
  PaginatedUserResponseDto,
} from "./dto/user-response.dto";
import {
  RequestEmailUpdateDto,
  VerifyEmailUpdateDto,
} from "./dto/email-update.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserFilterDto } from "./dto/user-filter.dto";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("users")
@ApiBearerAuth("JWT")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get current user profile" })
  @ApiOkResponse({
    type: UserResponseDto,
    description: "User profile retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.findById(user.id);
  }

  @Patch("profile")
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update current user profile" })
  @ApiBody({
    type: UpdateProfileDto,
    description: "Profile fields to update",
    examples: {
      default: {
        value: {
          fullName: "John Updated",
          phone: "08099887766",
          bankName: "GTBank",
          accountNumber: "0123456789",
        },
      },
    },
  })
  @ApiOkResponse({
    type: UserResponseDto,
    description: "Profile updated successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.update(user.id, dto);
  }

  @Post("request-email-update")
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Request an email update with OTP" })
  @ApiBody({
    type: RequestEmailUpdateDto,
    description: "New email address",
    examples: { default: { value: { newEmail: "new.email@example.com" } } },
  })
  @ApiResponse({
    status: 201,
    description: "OTP sent to new email",
    example: { message: "OTP sent to new email" },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid email or email already in use",
  })
  requestEmailUpdate(
    @CurrentUser() user: { id: string },
    @Body() dto: RequestEmailUpdateDto,
  ) {
    return this.usersService.requestEmailUpdate(user.id, dto.newEmail);
  }

  @Post("verify-email-update")
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Verify OTP and update email" })
  @ApiBody({
    type: VerifyEmailUpdateDto,
    description: "6-digit OTP code",
    examples: { default: { value: { code: "123456" } } },
  })
  @ApiResponse({
    status: 201,
    description: "Email updated successfully",
    example: { message: "Email updated successfully" },
  })
  @ApiResponse({ status: 400, description: "Invalid or expired OTP" })
  verifyEmailUpdate(
    @CurrentUser() user: { id: string },
    @Body() dto: VerifyEmailUpdateDto,
  ) {
    return this.usersService.verifyEmailUpdate(user.id, dto.code);
  }

  @Get("leaderboard")
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get affiliate leaderboard" })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of top affiliates to return",
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: "Leaderboard retrieved",
    example: [
      {
        id: "uuid",
        fullName: "Top Affiliate",
        totalEarnings: 500000,
        referralCount: 150,
      },
      {
        id: "uuid-2",
        fullName: "Second Place",
        totalEarnings: 400000,
        referralCount: 120,
      },
    ],
  })
  getLeaderboard(@Query("limit") limit?: number) {
    return this.usersService.getLeaderboard(limit);
  }

  @Post("agreement/sign")
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Sign the latest affiliate agreement" })
  @ApiResponse({
    status: 201,
    description: "Agreement signed successfully",
    example: {
      message: "Agreement signed",
      signedAt: "2026-05-06T10:00:00.000Z",
    },
  })
  signAgreement(@CurrentUser() user: { id: string }) {
    return this.usersService.signAgreement(user.id);
  }

  @Get("agreement/status")
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Check if user has signed the latest agreement" })
  @ApiResponse({
    status: 200,
    description: "Agreement status",
    example: {
      hasSigned: true,
      signedAt: "2026-05-01T10:00:00.000Z",
      agreementVersion: "1.0",
    },
  })
  getAgreementStatus(@CurrentUser() user: { id: string }) {
    return this.usersService.getAgreementStatus(user.id);
  }

  @Get("export")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Export all users as CSV" })
  @ApiResponse({ status: 200, description: "CSV file downloaded" })
  async exportUsers(@Res() res: Response) {
    const csv = await this.usersService.exportUsersCsv();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=users.csv");
    return res.status(200).send(csv);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new user/agent (Admin only)' })
  @ApiBody({
    type: CreateUserAdminDto,
    description: 'New user/agent details',
    examples: {
      default: {
        value: {
          fullName: 'Jane Marketer',
          email: 'jane@example.com',
          phone: '08012345678',
          password: 'securePassword123',
          role: 'AGENT',
          dailyLeadTarget: 10,
          monthlyConversionTarget: 20,
        },
      },
    },
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email or phone already in use' })
  createUserByAdmin(@Body() dto: CreateUserAdminDto) {
    return this.usersService.createUserByAdmin(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "List all users (Admin only)" })
  @ApiOkResponse({ type: PaginatedUserResponseDto })
  async findAllAdmin(@Query() filterDto: UserFilterDto) {
    const { data, total } = await this.usersService.findAllAdmin(filterDto);

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

  @Get(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get user details by ID (Admin only)" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 404, description: "User not found" })
  findOneAdmin(@Param("id") id: string) {
    return this.usersService.findOneAdmin(id);
  }

  @Patch(":id/profile")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update user profile by ID (Admin only)" })
  @ApiBody({
    type: UpdateProfileDto,
    description: "Profile fields to update",
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 404, description: "User not found" })
  updateUserByAdmin(
    @Param("id") id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Patch(":id/status")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update user status (Admin only)" })
  @ApiBody({
    type: UpdateUserStatusDto,
    description: "New user status",
    examples: { default: { value: { status: "ACTIVE" } } },
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 400, description: "Invalid status" })
  updateStatus(@Param("id") id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, dto);
  }

  @Patch(":id/kyc")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Approve/Reject KYC (Admin only)" })
  @ApiBody({
    type: UpdateKycDto,
    description: "KYC status update",
    examples: {
      approve: { value: { status: "APPROVED" } },
      reject: { value: { status: "REJECTED", reason: "Invalid documents" } },
    },
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 400, description: "Invalid KYC status" })
  updateKyc(@Param("id") id: string, @Body() dto: UpdateKycDto) {
    return this.usersService.updateKyc(id, dto);
  }

  @Patch(":id/role")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update user role (Admin only)" })
  @ApiBody({
    description: "New role",
    examples: { default: { value: { role: "ADMIN" } } },
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 400, description: "Invalid role" })
  updateRole(@Param("id") id: string, @Body() data: { role: Role }) {
    return this.usersService.updateRole(id, data.role);
  }

  @Patch(":id/manager-mode")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update user manager mode status (Admin only)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        isManagerMode: { type: "boolean" }
      },
      required: ["isManagerMode"]
    }
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 400, description: "Invalid input" })
  updateManagerMode(
    @Param("id") id: string,
    @Body() data: { isManagerMode: boolean }
  ) {
    return this.usersService.updateManagerMode(id, data.isManagerMode);
  }
}
