import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resend: Resend;
  private readonly logger = new Logger(ResendService.name);
  private readonly fromEmail = 'support@vemtap.com';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not found in environment variables. Email delivery will be disabled.');
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    if (!this.resend) {
      this.logger.error('Resend client not initialized. Cannot send email.');
      return false;
    }
    try {
      this.logger.log(`Sending OTP email to ${to}`);
      
      const { data, error } = await this.resend.emails.send({
        from: `Vemtap <${this.fromEmail}>`,
        to: [to],
        subject: 'Verify your new email address',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Email Verification</h2>
            <p>You requested to update your email address on Vemtap.</p>
            <p>Your verification code is:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; border-radius: 5px;">
              ${otp}
            </div>
            <p style="margin-top: 20px; color: #666;">This code will expire in 10 minutes. If you did not request this change, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">&copy; 2026 Vemtap. All rights reserved.</p>
          </div>
        `,
      });

      if (error) {
        this.logger.error('Failed to send email via Resend', error);
        return false;
      }

      this.logger.log(`Email sent successfully: ${data?.id}`);
      return true;
    } catch (err) {
      this.logger.error('Error sending email', err);
      return false;
    }
  }

  async sendBroadcastEmail(emails: string[], subject: string, message: string): Promise<number> {
    if (!this.resend) {
      this.logger.error('Resend client not initialized. Cannot send broadcast.');
      return 0;
    }

    let sentCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (email) => {
          try {
            const { error } = await this.resend.emails.send({
              from: `Vemtap <${this.fromEmail}>`,
              to: [email],
              subject: subject,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                  <h2 style="color: #333;">${subject}</h2>
                  <div style="color: #444; line-height: 1.6; white-space: pre-wrap;">
                    ${message}
                  </div>
                  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                  <p style="font-size: 12px; color: #999;">&copy; 2026 Vemtap. All rights reserved.</p>
                </div>
              `,
            });
            if (!error) sentCount++;
          } catch (err) {
            this.logger.error(`Failed to send broadcast email to ${email}`, err);
          }
        }),
      );
    }

    this.logger.log(`Broadcast completed. Sent ${sentCount} emails.`);
    return sentCount;
  }
}
