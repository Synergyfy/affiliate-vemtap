import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Header,
  Res
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessFilterDto } from './dto/business-filter.dto';
import { UpdateBusinessStatusDto } from './dto/update-business-status.dto';
import { BusinessResponseDto, PaginatedBusinessResponseDto } from './dto/business-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('businesses')
@ApiBearerAuth()
@Controller('businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all businesses (Admin only)' })
  @ApiOkResponse({ type: PaginatedBusinessResponseDto })
  async findAllAdmin(@Query() filterDto: BusinessFilterDto) {
    const { data, total } = await this.businessesService.findAllAdmin(filterDto);

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

  @Get('export')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export businesses as CSV' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=businesses.csv')
  async exportCsv(@CurrentUser() user: { id: string }, @Query() filterDto: BusinessFilterDto, @Res() res: Response) {
    const csv = await this.businessesService.exportToCsv(user.id, filterDto);
    return res.send(csv);
  }

  @Get('me')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get businesses referred by the current user' })
  @ApiOkResponse({ type: PaginatedBusinessResponseDto })
  async findAll(@CurrentUser() user: { id: string }, @Query() filterDto: BusinessFilterDto) {
    const { data, total } = await this.businessesService.findAll(user.id, filterDto);

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

  @Post()
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Register a new business referral' })
  @ApiOkResponse({ type: BusinessResponseDto })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateBusinessDto) {
    return this.businessesService.create(user.id, dto);
  }

  @Patch(':id')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update business details (Affiliate access restricted)' })
  @ApiOkResponse({ type: BusinessResponseDto })
  update(
    @Param('id') id: string, 
    @CurrentUser() user: { id: string }, 
    @Body() dto: UpdateBusinessDto
  ) {
    return this.businessesService.update(id, user.id, dto);
  }

  @Post(':id/reminder')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send a payment reminder to the business owner' })
  sendReminder(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.businessesService.sendReminder(id, user.id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update business status and trigger commissions (Admin only)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBusinessStatusDto) {
    return this.businessesService.updateStatus(id, dto);
  }
}
