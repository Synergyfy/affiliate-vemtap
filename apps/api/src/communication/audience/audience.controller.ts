import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { AudienceService } from './audience.service';
import { AudiencePreviewDto, AudienceFilterDto, ContactQueryDto } from '../dto/audience.dto';

@ApiTags('Communication Audience')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication/audience')
export class AudienceController {
  constructor(private readonly audienceService: AudienceService) {}

  @Get('preview')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Preview how many contacts match the selected audience filters (own leads for non-admins)' })
  preview(@CurrentUser() user: { id: string; role: string }, @Query() filters: AudiencePreviewDto) {
    return this.audienceService.preview(filters, user);
  }

  @Get('contacts')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List matching contacts for the selected audience (own leads for non-admins)' })
  listContacts(
    @CurrentUser() user: { id: string; role: string },
    @Query() filters: AudienceFilterDto,
    @Query() query: ContactQueryDto,
  ) {
    return this.audienceService.listContacts(filters, query, user);
  }
}
