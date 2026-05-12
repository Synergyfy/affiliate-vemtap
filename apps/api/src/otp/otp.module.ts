import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtpService } from './otp.service';
import { ResendService } from './resend.service';

@Module({
  imports: [ConfigModule],
  providers: [OtpService, ResendService],
  exports: [OtpService, ResendService],
})
export class OtpModule {}
