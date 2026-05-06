import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  /**
   * Generates a 6-digit numeric OTP.
   */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generates a secure random token.
   */
  generateToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Checks if an OTP has expired.
   * @param expiry The expiry date to check.
   */
  isExpired(expiry: Date): boolean {
    return new Date() > expiry;
  }
}
