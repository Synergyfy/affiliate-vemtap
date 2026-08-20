/**
 * SMS provider abstraction.
 *
 * VEMTAP sends SMS through a pluggable provider. Initially a DisabledSmsProvider
 * is used (logs/simulates), and a real provider (Termii, Africa's Talking, etc.)
 * can be added later behind the same interface without redesigning the engine.
 */
export interface SmsSendResult {
  success: boolean;
  providerMessageId?: string | null;
  error?: string | null;
}

export interface SmsProvider {
  /** Provider identifier, e.g. 'termii', 'africastalking', 'disabled'. */
  readonly name: string;
  send(to: string, message: string, senderId?: string | null): Promise<SmsSendResult>;
}
