import { Controller, Get, Post, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { ExternalService } from './external.service';
import { RecordReferralDto } from './dto/record-referral.dto';
import { ProcessWithdrawalDto } from './dto/process-withdrawal.dto';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

@ApiTags('External — Vemtap Integration')
@ApiHeader({
  name: 'x-api-key',
  description: 'API key issued by an admin. Required on all external endpoints.',
  required: true,
})
@UseGuards(ApiKeyGuard)
@Controller('external')
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  @Get('referrals/:code/validate')
  @ApiOperation({
    summary: 'Validate a referral code',
    description: 'Returns { valid: true, affiliateId, fullName } or { valid: false }. Never throws 404 — always returns a clean boolean.',
  })
  @ApiParam({ name: 'code', description: 'Affiliate referral code e.g. VEM-ABC123' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validateReferralCode(@Param('code') code: string) {
    return this.externalService.validateReferralCode(code);
  }

  @Post('referrals/record')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record a successful referral',
    description: 'Creates a Business record and triggers commission generation for the affiliate.',
  })
  @ApiResponse({ status: 201, description: 'Referral recorded and commission triggered' })
  @ApiResponse({ status: 404, description: 'Referral code not found' })
  @ApiResponse({ status: 409, description: 'Business email already registered' })
  async recordReferral(@Body() dto: RecordReferralDto) {
    return this.externalService.recordReferral(dto);
  }

  @Post('withdrawals/process')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a withdrawal request for an affiliate',
    description: 'Creates a PENDING withdrawal — admin still approves in the dashboard. Validates KYC and bank details.',
  })
  @ApiResponse({ status: 201, description: 'Withdrawal request created (PENDING)' })
  @ApiResponse({ status: 400, description: 'Insufficient balance, missing KYC, or missing bank details' })
  @ApiResponse({ status: 404, description: 'Affiliate not found' })
  async processWithdrawal(@Body() dto: ProcessWithdrawalDto) {
    return this.externalService.processWithdrawal(dto);
  }
}
