import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { SalesViewService } from './sales-view.service';

const SALES_ROLES = [Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE, Role.ADMIN, Role.SUPER_ADMIN];

@ApiTags('Communication Sales View')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication/sales')
export class SalesViewController {
  constructor(private readonly salesViewService: SalesViewService) {}

  @Get('today')
  @Roles(...SALES_ROLES)
  @ApiOperation({ summary: "Today's follow-ups for the authenticated salesperson (or their team)" })
  today(@CurrentUser() user: { id: string; role: string }) {
    return this.salesViewService.today(user);
  }
}
