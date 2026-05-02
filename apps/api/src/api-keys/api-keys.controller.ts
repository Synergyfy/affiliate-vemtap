import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

type SafeUser = { id: string; role: Role };

@ApiTags('Admin — API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({
    summary: 'Generate a new API key',
    description: 'Returns the raw key ONCE — store it securely. It cannot be retrieved again.',
  })
  async generate(@Body() dto: CreateApiKeyDto, @CurrentUser() user: SafeUser) {
    return this.apiKeysService.generate(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all API keys (metadata only — no raw keys)' })
  async findAll() {
    return this.apiKeysService.findAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiParam({ name: 'id', description: 'API Key ID' })
  async revoke(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    await this.apiKeysService.revoke(id, user.id);
  }
}
