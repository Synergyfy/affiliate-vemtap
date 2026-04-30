import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalResponseDto, PaginatedWithdrawalResponseDto } from './dto/withdrawal-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, WithdrawalStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('withdrawals')
@ApiBearerAuth()
@Controller('withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Request a withdrawal' })
  @ApiOkResponse({ type: WithdrawalResponseDto })
  create(@CurrentUser() user: { id: string }, @Body() data: { amount: number }) {
    return this.withdrawalsService.create(user.id, data.amount);
  }

  @Get('me')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get own withdrawals' })
  @ApiOkResponse({ type: PaginatedWithdrawalResponseDto })
  async findAll(@CurrentUser() user: { id: string }, @Query() paginationDto: PaginationDto) {
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

  // --- ADMIN ENDPOINTS ---

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all withdrawals (Admin only)' })
  @ApiOkResponse({ type: PaginatedWithdrawalResponseDto })
  async findAllAdmin(@Query() paginationDto: PaginationDto) {
    const { data, total } = await this.withdrawalsService.findAllAdmin({
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

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update withdrawal status (Admin only)' })
  updateStatus(
    @Param('id') id: string, 
    @Body() data: { status: WithdrawalStatus },
    @CurrentUser() admin: { id: string },
  ) {
    return this.withdrawalsService.updateStatus(id, data.status, admin.id);
  }
}
