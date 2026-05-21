import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '@prisma/client';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';
import { PlatformSettingsResponseDto } from './dto/settings-response.dto';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get platform settings' })
  @ApiOkResponse({ type: PlatformSettingsResponseDto })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update platform settings' })
  @ApiOkResponse({ type: PlatformSettingsResponseDto })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }

  @Public()
  @Get('agreement')
  @ApiOperation({ summary: 'Get affiliate agreement template (public)' })
  getAgreement() {
    return this.settingsService.getAgreement();
  }

  @Patch('agreement')
  @ApiOperation({ summary: 'Update affiliate agreement template' })
  updateAgreement(@Body() dto: UpdateAgreementDto) {
    return this.settingsService.updateAgreement(dto);
  }
}
