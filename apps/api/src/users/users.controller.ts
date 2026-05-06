import { 
  Controller, 
  Get, 
  Patch, 
  Post,
  Body, 
  Param,
  Query,
  Res,
  UseGuards 
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserStatusDto, UpdateKycDto } from './dto/admin-user.dto';
import { UserResponseDto, PaginatedUserResponseDto } from './dto/user-response.dto';
import { RequestEmailUpdateDto, VerifyEmailUpdateDto } from './dto/email-update.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.findById(user.id);
  }

  @Patch('profile')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.usersService.update(user.id, dto);
  }

  @Post('request-email-update')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Request an email update with OTP' })
  requestEmailUpdate(@CurrentUser() user: { id: string }, @Body() dto: RequestEmailUpdateDto) {
    return this.usersService.requestEmailUpdate(user.id, dto.newEmail);
  }

  @Post('verify-email-update')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verify OTP and update email' })
  verifyEmailUpdate(@CurrentUser() user: { id: string }, @Body() dto: VerifyEmailUpdateDto) {
    return this.usersService.verifyEmailUpdate(user.id, dto.code);
  }

  @Get('leaderboard')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get affiliate leaderboard' })
  getLeaderboard(@Query('limit') limit?: number) {
    return this.usersService.getLeaderboard(limit);
  }

  // --- ADMIN ENDPOINTS ---

  @Get('export')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export all users as CSV' })
  async exportUsers(@Res() res: Response) {
    const csv = await this.usersService.exportUsersCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    return res.status(200).send(csv);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiOkResponse({ type: PaginatedUserResponseDto })
  async findAllAdmin(@Query() paginationDto: PaginationDto) {
    const { data, total } = await this.usersService.findAllAdmin({
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

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user details by ID (Admin only)' })
  findOneAdmin(@Param('id') id: string) {
    return this.usersService.findOneAdmin(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, dto);
  }

  @Patch(':id/kyc')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve/Reject KYC (Admin only)' })
  updateKyc(@Param('id') id: string, @Body() dto: UpdateKycDto) {
    return this.usersService.updateKyc(id, dto);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  updateRole(@Param('id') id: string, @Body() data: { role: Role }) {
    return this.usersService.updateRole(id, data.role);
  }
}
