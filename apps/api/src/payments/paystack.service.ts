import { Injectable, Logger } from '@nestjs/common';
import { Paystack } from 'paystack-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackService {
  private paystack: any;
  private readonly logger = new Logger(PaystackService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('PAYSTACK_SECRET_KEY not found in environment variables. Payment features will be disabled.');
    } else {
      this.paystack = new Paystack(secretKey);
    }
  }

  async createSubaccount(data: {
    business_name: string;
    settlement_bank: string;
    account_number: string;
    percentage_charge: number;
  }) {
    if (!this.paystack) {
      this.logger.error('Paystack client not initialized.');
      return null;
    }
    try {
      const response = await this.paystack.subaccounts.create(data);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create subaccount', error);
      throw error;
    }
  }

  async listBanks() {
    if (!this.paystack) {
      this.logger.error('Paystack client not initialized.');
      return [];
    }
    try {
      const response = await this.paystack.misc.banks({ country: 'nigeria' });
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
    if (!this.paystack) {
      this.logger.error('Paystack client not initialized.');
      return null;
    }
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
    if (!this.paystack) {
      this.logger.error('Paystack client not initialized.');
      return null;
    }
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

  async resolveAccount(accountNumber: string, bankCode: string) {
    if (!this.paystack) {
      this.logger.error('Paystack client not initialized.');
      return null;
    }
    try {
      const response = await this.paystack.verification.resolveAccount({
        account_number: accountNumber,
        bank_code: bankCode,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to resolve account: ${error.message}`);
      throw error;
    }
  }
}
