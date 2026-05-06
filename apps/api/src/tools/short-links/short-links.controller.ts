import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ShortLinksService } from "./short-links.service";
import { CreateShortLinkDto } from "./dto/create-short-link.dto";

@ApiTags("short-links")
@ApiBearerAuth("JWT")
@Controller("tools/short-links")
@UseGuards(JwtAuthGuard)
export class ShortLinksController {
  constructor(private readonly shortLinksService: ShortLinksService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new custom short link",
    description:
      "Creates a short link with a custom code that redirects to the affiliate's referral URL.",
  })
  @ApiBody({
    type: CreateShortLinkDto,
    description: "Custom short link code",
    examples: { default: { value: { code: "my-link" } } },
  })
  @ApiResponse({
    status: 201,
    description: "Short link created",
    example: {
      id: "sl-uuid",
      code: "my-link",
      url: "https://vemtap.link/my-link",
      affiliateId: "user-uuid",
      clicks: 0,
      createdAt: "2026-05-06T10:00:00.000Z",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Code already taken or invalid format",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(@Request() req: any, @Body() dto: CreateShortLinkDto) {
    return this.shortLinksService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all short links for the logged-in affiliate",
    description:
      "Returns all custom short links created by the current user with click statistics.",
  })
  @ApiResponse({
    status: 200,
    description: "Short links retrieved",
    example: [
      {
        id: "sl-uuid",
        code: "my-link",
        url: "https://vemtap.link/my-link",
        clicks: 42,
        createdAt: "2026-05-01T10:00:00.000Z",
      },
    ],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll(@Request() req: any) {
    return this.shortLinksService.findAll(req.user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a short link" })
  @ApiParam({ name: "id", description: "Short link ID", example: "sl-uuid" })
  @ApiResponse({
    status: 200,
    description: "Short link deleted",
    example: { message: "Short link deleted" },
  })
  @ApiResponse({ status: 404, description: "Short link not found" })
  @ApiResponse({ status: 403, description: "You do not own this short link" })
  remove(@Request() req: any, @Param("id") id: string) {
    return this.shortLinksService.remove(req.user.id, id);
  }
}
