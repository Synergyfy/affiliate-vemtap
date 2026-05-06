import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTrainingModuleDto, UpdateTrainingModuleDto, UpdateTrainingProgressDto } from './dto/training.dto';
import { TrainingModuleResponseDto, PaginatedTrainingModuleResponseDto } from './dto/training-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('training')
@ApiBearerAuth()
@Controller('training')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('modules')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get available training modules' })
  @ApiOkResponse({ type: PaginatedTrainingModuleResponseDto })
  async findAll(@CurrentUser() user: { id: string }, @Query() paginationDto: PaginationDto) {
    const { data, total } = await this.trainingService.findAllModulesAffiliate(user.id, {
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

  @Patch('modules/:id/progress')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update progress for a module' })
  updateProgress(
    @Param('id') moduleId: string,
    @Body() data: UpdateTrainingProgressDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.trainingService.updateProgress(user.id, moduleId, data);
  }

  // --- ADMIN ENDPOINTS ---

  @Get('admin/modules')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all modules for management (Admin only)' })
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

  @Get('admin/modules/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get full module details (Admin only)' })
  findOneAdmin(@Param('id') id: string) {
    return this.trainingService.findModuleDetailsAdmin(id);
  }

  @Post('admin/modules')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new training module (Admin only)' })
  createModule(@Body() dto: CreateTrainingModuleDto) {
    return this.trainingService.createModule(dto);
  }

  @Patch('admin/modules/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a training module (Admin only)' })
  updateModule(@Param('id') id: string, @Body() dto: UpdateTrainingModuleDto) {
    return this.trainingService.updateModule(id, dto);
  }

  @Delete('admin/modules/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a training module (Admin only)' })
  deleteModule(@Param('id') id: string) {
    return this.trainingService.deleteModule(id);
  }
}
