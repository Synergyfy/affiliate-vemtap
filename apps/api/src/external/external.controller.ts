import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Headers,
  Res,
  UseInterceptors,
} from "@nestjs/common";
import type { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiHeader,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from "@nestjs/swagger";
import { ExternalService } from "./external.service";
import { RecordReferralDto } from "./dto/record-referral.dto";
import { ProcessWithdrawalDto } from "./dto/process-withdrawal.dto";
import { GetAffiliatesFilterDto } from "./dto/get-affiliates-filter.dto";
import { AttachBusinessDto } from "./dto/attach-business.dto";
import { ApiKeyGuard } from "../api-keys/guards/api-key.guard";
import { RateLimitGuard } from "../common/guards/rate-limit.guard";
import { TimeoutInterceptor } from "../common/interceptors/timeout.interceptor";

@ApiTags("External — Vemtap Integration")
@ApiSecurity("api-key")
@ApiHeader({
  name: "x-api-key",
  description: "API key issued by an admin for external integrations",
  required: true,
})
@UseGuards(ApiKeyGuard, RateLimitGuard)
@UseInterceptors(TimeoutInterceptor)
@Controller("external")
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  @Get("referrals/:code/validate")
  @ApiOperation({
    summary: "Validate a referral code",
    description:
      "Returns { valid: true, affiliateId, fullName } or { valid: false }. Never throws 404 — always returns a clean boolean.",
  })
  @ApiParam({
    name: "code",
    description: "Affiliate referral code e.g. VEM-ABC123",
    example: "VEM-ABC123",
  })
  @ApiResponse({
    status: 200,
    description: "Validation result",
  })
  @ApiResponse({ status: 401, description: "Invalid API key" })
  async validateReferralCode(@Param("code") code: string) {
    return this.externalService.validateReferralCode(code);
  }

  @Post("referrals/record")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Record a payment commission event",
    description:
      "Credits the affiliate rate% × amountPaid for this payment. externalReference is the payment reference (unique per payment), so recurring payments are separate commission events. Idempotent on Idempotency-Key header and externalReference.",
  })
  @ApiHeader({
    name: "Idempotency-Key",
    description:
      "Optional unique key for idempotent retries. Replays return the original success response without creating a duplicate.",
    required: false,
  })
  @ApiBody({
    type: RecordReferralDto,
    description: "Referral details",
    examples: {
      default: {
        value: {
          referralCode: "VEM-ABC123",
          businessName: "Acme Ltd",
          ownerName: "John Doe",
          email: "john@acme.com",
          phone: "08012345678",
          planName: "Professional",
          planId: "25a9b67b-63ed-4df8-b222-58d0a2e22715",
          address: "123 Business Way, Lagos",
          businessId: "edcf9de7-2397-474b-8720-412a4cb95e78",
          amountPaid: 15000,
          isFirstPayment: true,
          rate: 30,
          externalReference: "SUB-edcf9de7-...-1786706909521",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Payment commission credited",
    example: {
      businessId: "business-uuid",
      commissionTriggered: true,
      deduplicated: false,
    },
  })
  @ApiResponse({
    status: 200,
    description: "Idempotent replay — original success response returned",
  })
  @ApiResponse({
    status: 404,
    description: "Referral code not found",
  })
  @ApiResponse({ status: 401, description: "Invalid API key" })
  async recordReferral(
    @Body() dto: RecordReferralDto,
    @Headers("idempotency-key") idempotencyKey?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.externalService.recordReferral(dto, idempotencyKey);
    res?.status(result.deduplicated ? HttpStatus.OK : HttpStatus.CREATED);
    return result;
  }

  @Post("withdrawals/process")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a withdrawal request for an affiliate",
    description:
      "Creates a PENDING withdrawal — admin still approves in the dashboard. Identifies the affiliate by email; bank details are supplied in the payload. Idempotent on Idempotency-Key header and externalReference.",
  })
  @ApiHeader({
    name: "Idempotency-Key",
    description:
      "Optional unique key for idempotent retries. Replays return the original success response without creating a duplicate.",
    required: false,
  })
  @ApiBody({
    type: ProcessWithdrawalDto,
    description: "Withdrawal details",
    examples: {
      default: {
        value: {
          email: "john@affiliate.com",
          amount: 50000,
          bankName: "GTBank",
          accountNumber: "0123456789",
          accountName: "John Doe",
          externalReference: "VEM-WD-2024-001",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Withdrawal request created (PENDING)",
    example: {
      withdrawalId: "withdrawal-uuid",
      status: "PENDING",
      deduplicated: false,
    },
  })
  @ApiResponse({
    status: 200,
    description: "Idempotent replay — original success response returned",
  })
  @ApiResponse({
    status: 400,
    description: "Insufficient balance, missing KYC, or invalid bank details",
  })
  @ApiResponse({
    status: 404,
    description: "Affiliate not found",
  })
  @ApiResponse({ status: 401, description: "Invalid API key" })
  async processWithdrawal(
    @Body() dto: ProcessWithdrawalDto,
    @Headers("idempotency-key") idempotencyKey?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.externalService.processWithdrawal(dto, idempotencyKey);
    res?.status(result.deduplicated ? HttpStatus.OK : HttpStatus.CREATED);
    return result;
  }

  @Get("affiliates")
  @ApiOperation({
    summary: "Fetch affiliate users for Vemtap selection",
    description: "Allows fetching active/all affiliate users with search & filter capabilities for selection.",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully fetched affiliate users",
  })
  @ApiResponse({ status: 401, description: "Invalid API key" })
  async getAffiliates(@Query() filters: GetAffiliatesFilterDto) {
    return this.externalService.getAffiliates(filters);
  }

  @Post("businesses/attach")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Attach a business to an affiliate user",
    description: "Allows manual attachment of a business to an affiliate. Validates that no affiliate is already attached to this business (using the business's email).",
  })
  @ApiBody({
    type: AttachBusinessDto,
    description: "Manual attachment details",
  })
  @ApiResponse({
    status: 201,
    description: "Business successfully attached and commission triggered",
  })
  @ApiResponse({
    status: 400,
    description: "Affiliate not active or invalid details",
  })
  @ApiResponse({
    status: 404,
    description: "Affiliate not found",
  })
  @ApiResponse({
    status: 409,
    description: "An affiliate is already attached to this business",
  })
  @ApiResponse({ status: 401, description: "Invalid API key" })
  async attachBusiness(@Body() dto: AttachBusinessDto) {
    return this.externalService.attachBusiness(dto);
  }
}
