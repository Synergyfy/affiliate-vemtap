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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Role } from "@prisma/client";

type SafeUser = { id: string; role: Role };

@ApiTags("Admin — API Keys")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller("admin/api-keys")
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({
    summary: "Generate a new API key",
    description:
      "Creates a new API key for external integrations. The raw key is returned ONCE — store it securely. It cannot be retrieved again.",
  })
  @ApiBody({
    type: CreateApiKeyDto,
    description: "API key label",
    examples: { default: { value: { name: "Vemtap Production" } } },
  })
  @ApiResponse({
    status: 201,
    description: "API key generated",
    example: {
      id: "key-uuid",
      name: "Vemtap Production",
      key: "vem_ak_live_xxxxxxxxxxxxxxxx",
      createdAt: "2026-05-06T10:00:00.000Z",
      isActive: true,
    },
  })
  async generate(@Body() dto: CreateApiKeyDto, @CurrentUser() user: SafeUser) {
    return this.apiKeysService.generate(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List all API keys (metadata only — no raw keys)" })
  @ApiResponse({
    status: 200,
    description: "API keys list",
    example: [
      {
        id: "key-uuid",
        name: "Vemtap Production",
        prefix: "vem_ak_live_abc",
        createdAt: "2026-05-01T10:00:00.000Z",
        isActive: true,
        lastUsedAt: "2026-05-05T14:00:00.000Z",
      },
    ],
  })
  async findAll() {
    return this.apiKeysService.findAll();
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke an API key" })
  @ApiParam({ name: "id", description: "API Key ID to revoke" })
  @ApiResponse({ status: 204, description: "API key revoked successfully" })
  @ApiResponse({ status: 404, description: "API key not found" })
  async revoke(@Param("id") id: string, @CurrentUser() user: SafeUser) {
    await this.apiKeysService.revoke(id, user.id);
  }
}
