import { Controller, Post, Body, Ip, Headers } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { TrackingService } from "./tracking.service";
import { NotifyClickDto } from "./dto/notify-click.dto";

@ApiTags("tracking")
@Controller("tracking")
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post("notify-click")
  @ApiOperation({
    summary: "Notify backend of a link click",
    description:
      "Internal/platform endpoint to track when a user clicks an affiliate link. IP, User-Agent, and Referer are automatically captured from headers if not provided in body.",
  })
  @ApiBody({
    type: NotifyClickDto,
    description: "Click tracking data",
    examples: {
      default: {
        value: {
          referralCode: "VEM-ABC123",
          shortLinkCode: "my-link",
          secret: "platform-secret",
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Click recorded successfully",
    example: { message: "Click recorded", clickId: "click-uuid" },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid payload or missing required fields",
  })
  @ApiResponse({ status: 401, description: "Invalid secret token" })
  async notifyClick(
    @Body() dto: NotifyClickDto,
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
    @Headers("referer") referer: string,
  ) {
    const finalDto = {
      ...dto,
      ip: dto.ip || ip,
      userAgent: dto.userAgent || userAgent,
      referer: dto.referer || referer,
    };

    return this.trackingService.notifyClick(finalDto);
  }
}
