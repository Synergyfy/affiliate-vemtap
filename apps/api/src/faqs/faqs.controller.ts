import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FaqsService } from './faqs.service';

@ApiTags('faqs')
@ApiBearerAuth()
@Controller('faqs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Get()
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  getPublished() {
    return this.faqsService.getPublished();
  }
}
