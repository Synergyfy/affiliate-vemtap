import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CommunicationSettingsService } from './communication-settings.service';
import { UpdateCommunicationSettingsDto } from '../dto/communication-settings.dto';

const ADMIN_ROLES = [Role.ADMIN, Role.SUPER_ADMIN];

@ApiTags('Communication Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication/settings')
export class CommunicationSettingsController {
  constructor(private readonly settingsService: CommunicationSettingsService) {}

  @Get('blacklisted-words')
  @ApiOperation({ summary: 'Get list of SMS blacklisted words (available to all authenticated users)' })
  async getBlacklistedWords() {
    const settings = await this.settingsService.getSettings();
    return {
      blacklistedWords: settings.smsBlacklistedWords ?? [],
    };
  }

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get communication settings (SMS toggle, frequency limits, policies)' })
  get() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update communication settings' })
  update(@Body() dto: UpdateCommunicationSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }
}

