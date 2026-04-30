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

  async listBanks() {
    try {
      const response = await this.paystack.misc.listBanks({ country: 'nigeria' });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list banks', error);
      throw error;
    }
  }

  async createTransferRecipient(data: {
    name: string;
    account_number: string;
    bank_code: string;
  }) {
    try {
      const response = await this.paystack.recipient.create({
        type: 'nuban',
        name: data.name,
        account_number: data.account_number,
        bank_code: data.bank_code,
        currency: 'NGN',
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create transfer recipient', error);
      throw error;
    }
  }

  async initiateTransfer(amount: number, recipient: string, reference: string) {
    try {
      const response = await this.paystack.transfer.initiate({
        source: 'balance',
        amount: Math.round(amount * 100), // Ensure it's an integer
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
