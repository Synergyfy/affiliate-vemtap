import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider, SmsSendResult } from '../sms-provider.interface';

/**
 * No-op provider used until a real SMS provider is configured. It records the
 * intended send (for history/testing) but does not actually transmit anything,
 * so SMS costs are never incurred accidentally.
 */
@Injectable()
export class DisabledSmsProvider implements SmsProvider {
  readonly name = 'disabled';
  private readonly logger = new Logger(DisabledSmsProvider.name);

  async send(to: string, message: string, senderId?: string | null): Promise<SmsSendResult> {
    this.logger.log(
      `[SMS-SIMULATED] to=${to} sender=${senderId ?? 'default'} chars=${message.length}`,
    );
    return {
      success: true,
      providerMessageId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    };
  }
}
