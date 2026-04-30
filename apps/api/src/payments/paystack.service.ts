import { Injectable, Logger } from '@nestjs/common';
import { Paystack } from 'paystack-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackService {
  private paystack: any;
  private readonly logger = new Logger(PaystackService.name);

  constructor(private configService: ConfigService) {
    this.paystack = new Paystack(this.configService.get('PAYSTACK_SECRET_KEY') || '');
  }

  async createSubaccount(data: {
    business_name: string;
    settlement_bank: string;
    account_number: string;
    percentage_charge: number;
  }) {
    try {
      const response = await this.paystack.subaccount.create(data);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create subaccount', error);
      throw error;
    }
  }

  async initiateTransfer(amount: number, recipient: string, reference: string) {
    try {
      const response = await this.paystack.transfer.initiate({
        source: 'balance',
        amount: amount * 100, // Paystack uses kobo
        recipient,
        reference,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to initiate transfer', error);
      throw error;
    }
  }
}
