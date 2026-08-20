import { Controller, Get, Post, Param, Query, UseGuards, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { MessagesService } from '../messages/messages.service';
import { MessageQueryDto } from '../dto/message.dto';
import { RetrySmsDto } from '../dto/message.dto';

const ADMIN_ROLES = [Role.ADMIN, Role.SUPER_ADMIN];
const ALL_ROLES = [Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE, Role.ADMIN, Role.SUPER_ADMIN];

@ApiTags('Communication SMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication/sms')
export class SmsController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'List SMS messages / history (sent, failed, scheduled)' })
  listSms(@CurrentUser() user: { id: string; role: string }, @Query() filters: MessageQueryDto) {
    return this.messagesService.findMessages({ ...filters, channel: 'SMS' as any }, user);
  }

  @Post(':id/retry')
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed SMS message' })
  async retry(@Param('id') id: string, @Body() _dto: RetrySmsDto) {
    return this.messagesService.sendSms(id);
  }
}
