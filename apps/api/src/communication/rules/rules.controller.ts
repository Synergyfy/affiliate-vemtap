import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RulesService } from './rules.service';
import {
  CreateAutomationRuleDto,
  ReorderRulesDto,
  UpdateAutomationRuleDto,
} from '../dto/rule.dto';

const ADMIN_ROLES = [Role.ADMIN, Role.SUPER_ADMIN];

@ApiTags('Communication Automation Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication/rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List automation rules' })
  findAll() {
    return this.rulesService.findAll();
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get an automation rule' })
  findOne(@Param('id') id: string) {
    return this.rulesService.findOne(id);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create an automation rule' })
  create(@Body() dto: CreateAutomationRuleDto) {
    return this.rulesService.create(dto);
  }

  @Patch('reorder')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Reorder rules' })
  reorder(@Body() dto: ReorderRulesDto) {
    return this.rulesService.reorder(dto);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update an automation rule' })
  update(@Param('id') id: string, @Body() dto: UpdateAutomationRuleDto) {
    return this.rulesService.update(id, dto);
  }

  @Patch(':id/activate')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Activate a rule' })
  activate(@Param('id') id: string) {
    return this.rulesService.setActive(id, true);
  }

  @Patch(':id/deactivate')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Deactivate a rule' })
  deactivate(@Param('id') id: string) {
    return this.rulesService.setActive(id, false);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Delete a rule' })
  remove(@Param('id') id: string) {
    return this.rulesService.remove(id);
  }
}
