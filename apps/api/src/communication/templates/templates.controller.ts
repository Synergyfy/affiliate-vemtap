import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { TemplatesService } from './templates.service';
import {
  CreateCommunicationTemplateDto,
  TemplateQueryDto,
  TemplateStatusDto,
  UpdateCommunicationTemplateDto,
} from '../dto/template.dto';

@ApiTags('Communication Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List message templates' })
  findAll(@Query() filters: TemplateQueryDto) {
    return this.templatesService.findAll(filters);
  }

  @Get(':id')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a template' })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a message template' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateCommunicationTemplateDto) {
    return this.templatesService.create(user.id, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a template' })
  update(@Param('id') id: string, @Body() dto: UpdateCommunicationTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate / deactivate / archive a template' })
  setStatus(@Param('id') id: string, @Body() dto: TemplateStatusDto) {
    return this.templatesService.setStatus(id, dto.status);
  }
}
