import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Header,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto, HarvestLeadsFilterDto } from './dto/leads.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  create(@CurrentUser() user: any, @Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(user.id, createLeadDto);
  }

  @Get('harvest')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Harvest all business leads and contacts across all users (Admin only)' })
  findHarvest(@Query() filters: HarvestLeadsFilterDto) {
    return this.leadsService.findHarvest(filters);
  }

  @Get('harvest/export')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export harvested business leads as CSV (Admin only)' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=harvested_contacts.csv')
  async exportHarvest(
    @Query() filters: HarvestLeadsFilterDto,
    @Res() res: Response,
  ) {
    const csv = await this.leadsService.exportHarvest(filters);
    return res.send(csv);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get all leads for the current user' })
  findAll(@CurrentUser() user: any, @Query() filters: LeadFilterDto) {
    return this.leadsService.findAll(user, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get lead statistics for the current user' })
  getStats(@CurrentUser() user: any) {
    return this.leadsService.getStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific lead' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lead' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return this.leadsService.update(id, user, updateLeadDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a lead' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadsService.remove(id, user);
  }
}

