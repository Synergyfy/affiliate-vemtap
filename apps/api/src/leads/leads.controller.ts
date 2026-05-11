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
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto } from './dto/leads.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  create(@CurrentUser() user: any, @Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(user.id, createLeadDto);
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
    return this.leadsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lead' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return this.leadsService.update(id, user.id, updateLeadDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lead' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadsService.remove(id, user.id);
  }
}
