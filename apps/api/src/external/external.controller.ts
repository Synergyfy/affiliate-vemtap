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
} from "@nestjs/common";
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

@ApiTags("External — Vemtap Integration")
@ApiSecurity("api-key")
@ApiHeader({
  name: "x-api-key",
  description: "API key issued by an admin for external integrations",
  required: true,
})
@UseGuards(ApiKeyGuard)
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
    summary: "Record a successful referral",
    description:
      "Creates a Business record and triggers commission generation for the affiliate. Called by the Vemtap main backend after a successful business signup.",
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
          planType: "BASIC",
          address: "123 Business Way, Lagos",
          businessType: "Retail",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Referral recorded and commission triggered",
    example: {
      id: "business-uuid",
      businessName: "Acme Ltd",
      affiliateId: "affiliate-uuid",
      commissionAmount: 450,
      status: "TRIAL",
    },
  })
  @ApiResponse({
    status: 404,
    description: "Referral code not found",
  })
  @ApiResponse({
    status: 409,
    description: "Business email already registered",
  })
  @ApiResponse({ status: 401, description: "Invalid API key" })
  async recordReferral(@Body() dto: RecordReferralDto) {
    return this.externalService.recordReferral(dto);
  }

  @Post("withdrawals/process")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a withdrawal request for an affiliate",
    description:
      "Creates a PENDING withdrawal — admin still approves in the dashboard. Validates KYC and bank details before creating.",
  })
  @ApiBody({
    type: ProcessWithdrawalDto,
    description: "Withdrawal details",
    examples: {
      default: {
        value: {
          affiliateId: "affiliate-uuid",
          amount: 50000,
          externalReference: "VEM-WD-2024-001",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Withdrawal request created (PENDING)",
    example: {
      id: "withdrawal-uuid",
      amount: 50000,
      status: "PENDING",
      bankName: "GTBank",
      accountNumber: "0123456789",
      accountName: "John Doe",
      createdAt: "2026-05-06T10:00:00.000Z",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Insufficient balance, missing KYC, or missing bank details",
  })
  @ApiResponse({
    status: 404,
    description: "Affiliate not found",
  })
  @ApiResponse({ status: 401, description: "Invalid API key" })
  async processWithdrawal(@Body() dto: ProcessWithdrawalDto) {
    return this.externalService.processWithdrawal(dto);
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
