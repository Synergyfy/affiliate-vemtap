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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CommunicationMessageType, Role } from '@prisma/client';
import { MessagesService } from './messages.service';
import { SendMessageDto, MessageQueryDto } from '../dto/message.dto';

const ALL_ROLES = [Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE, Role.ADMIN, Role.SUPER_ADMIN];
const ADMIN_ROLES = [Role.ADMIN, Role.SUPER_ADMIN];

@ApiTags('Communication Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Roles(...ALL_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create/send a message to an audience or explicit contacts (scoped to own leads for sales roles)' })
  send(@CurrentUser() user: { id: string; role: string }, @Body() dto: SendMessageDto) {
    // SMS sending is admin-controlled (it costs money); sales roles may start
    // WhatsApp follow-up queues for their own leads.
    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (dto.channel === 'SMS' && !isPrivileged) {
      throw new ForbiddenException('Only admins can send SMS');
    }

    // Only admins may tag messages with special types (WELCOME / CUSTOMER_JOURNEY
    // are exempt from frequency limits and the subscription-override cancellation).
    // Sales roles are forced to MANUAL so they cannot bypass frequency controls.
    const type = isPrivileged
      ? dto.type
      : CommunicationMessageType.MANUAL;

    // createMessages dispatches immediate SMS synchronously; scheduled SMS is
    // queued for the cron; WhatsApp is left PENDING for assisted sending.
    return this.messagesService.createMessages(
      {
        channel: dto.channel,
        body: dto.body,
        leadIds: dto.leadIds,
        audience: dto.audience,
        templateId: dto.templateId,
        campaignId: dto.campaignId,
        type,
        scheduledForAt: dto.scheduledForAt ? new Date(dto.scheduledForAt) : null,
        sentById: user.id,
      },
      user,
    );
  }

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'List communication messages/history with filters (scoped to own leads for non-admins)' })
  findAll(@CurrentUser() user: { id: string; role: string }, @Query() filters: MessageQueryDto) {
    return this.messagesService.findMessages(filters, user);
  }

  @Get('contacts/:leadId')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Communication profile + history for a single contact (own leads only for non-admins)' })
  contactProfile(@CurrentUser() user: { id: string; role: string }, @Param('leadId') leadId: string) {
    return this.messagesService.contactProfile(leadId, user);
  }

  @Post(':id/send')
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a scheduled/pending SMS message now' })
  sendSms(@Param('id') id: string) {
    return this.messagesService.sendSms(id);
  }

  @Patch(':id/cancel')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Cancel a pending/scheduled message' })
  cancel(@Param('id') id: string) {
    return this.messagesService.cancelMessage(id);
  }
}
