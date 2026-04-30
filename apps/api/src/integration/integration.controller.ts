import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { IntegrationService } from './integration.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@ApiTags('integration')
@Controller('integration')
@UseGuards(ApiKeyGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post('vemtap/payment')
  @ApiOperation({ summary: 'Webhook for Vemtap main backend to notify about a business payment' })
  @ApiHeader({ name: 'x-vemtap-secret', description: 'Shared secret for authentication' })
  handlePayment(@Body() dto: any) {
    return this.integrationService.handlePaymentEvent(dto);
  }
}
