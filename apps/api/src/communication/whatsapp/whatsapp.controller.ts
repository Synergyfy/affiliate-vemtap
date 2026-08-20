import { Controller, Get, Post, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { WhatsAppService } from './whatsapp.service';

const SALES_ROLES = [Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE, Role.ADMIN, Role.SUPER_ADMIN];

@ApiTags('Communication WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication/whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Get('queue')
  @Roles(...SALES_ROLES)
  @ApiOperation({ summary: 'List the WhatsApp follow-up queue (own leads for salespeople, global for admins)' })
  getQueue(@CurrentUser() user: { id: string; role: string }, @Query('leadId') leadId?: string) {
    return this.whatsappService.getQueue(user, { leadId });
  }

  @Post(':messageId/mark-sent')
  @Roles(...SALES_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a prepared WhatsApp message as sent (user sent it in WhatsApp)' })
  markAsSent(@CurrentUser() user: { id: string; role: string }, @Param('messageId') messageId: string) {
    return this.whatsappService.markAsSent(messageId, user);
  }
}
