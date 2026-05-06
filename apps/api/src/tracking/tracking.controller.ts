import { Controller, Post, Body, Ip, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { NotifyClickDto } from './dto/notify-click.dto';

@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('notify-click')
  @ApiOperation({ summary: 'Notify backend of a link click (Internal/Platform use only)' })
  @ApiOkResponse({ description: 'Click recorded successfully' })
  async notifyClick(
    @Body() dto: NotifyClickDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Headers('referer') referer: string,
  ) {
    // Merge headers if not provided in body
    const finalDto = {
      ...dto,
      ip: dto.ip || ip,
      userAgent: dto.userAgent || userAgent,
      referer: dto.referer || referer,
    };
    
    return this.trackingService.notifyClick(finalDto);
  }
}
