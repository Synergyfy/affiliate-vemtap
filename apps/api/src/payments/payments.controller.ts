import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaystackService } from './paystack.service';

@ApiTags('Payments')
@Controller('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paystackService: PaystackService) {}

  @Get('banks')
  @ApiOperation({ summary: 'List all supported banks' })
  async getBanks() {
    return this.paystackService.listBanks();
  }

  @Get('verify-account')
  @ApiOperation({ summary: 'Verify a bank account number' })
  async verifyAccount(
    @Query('accountNumber') accountNumber: string,
    @Query('bankCode') bankCode: string,
  ) {
    return this.paystackService.resolveAccount(accountNumber, bankCode);
  }
}
