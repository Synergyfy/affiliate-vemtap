import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CampaignStatus, Role } from '@prisma/client';
import { CampaignsService } from './campaigns.service';
import {
  CampaignActionDto,
  CreateCampaignDto,
  UpdateCampaignDto,
} from '../dto/campaign.dto';

const ADMIN_ROLES = [Role.ADMIN, Role.SUPER_ADMIN];

@ApiTags('Communication Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List campaigns' })
  findAll(@Query('status') status?: CampaignStatus) {
    return this.campaignsService.findAll({ status });
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get a campaign' })
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a campaign' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(user.id, dto);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update a campaign' })
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'activate | pause | complete | cancel a campaign (activate fans out messages)' })
  changeStatus(@Param('id') id: string, @Body() dto: CampaignActionDto) {
    return this.campaignsService.changeStatus(id, dto);
  }
}
