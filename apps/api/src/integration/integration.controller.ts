import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { IntegrationService } from "./integration.service";
import { ApiKeyGuard } from "./guards/api-key.guard";

@ApiTags("integration")
@Controller("integration")
@UseGuards(ApiKeyGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post("vemtap/payment")
  @ApiOperation({
    summary:
      "Webhook for Vemtap main backend to notify about a business payment",
    description:
      "This endpoint is called by the Vemtap main backend when a referred business makes a payment. It triggers commission generation for the affiliate.",
  })
  @ApiHeader({
    name: "x-vemtap-secret",
    description: "Shared secret for authentication between Vemtap services",
    required: true,
  })
  @ApiBody({
    description: "Payment event payload",
    examples: {
      default: {
        value: {
          businessId: "business-uuid",
          affiliateId: "affiliate-uuid",
          amount: 3000,
          planType: "BASIC",
          paymentDate: "2026-05-06T10:00:00.000Z",
          externalReference: "PAY-2026-001",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Payment event processed and commissions triggered",
    example: { message: "Payment event processed", commissionAmount: 450 },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or missing x-vemtap-secret",
  })
  @ApiResponse({ status: 400, description: "Invalid payload" })
  handlePayment(@Body() dto: any) {
    return this.integrationService.handlePaymentEvent(dto);
  }
}
