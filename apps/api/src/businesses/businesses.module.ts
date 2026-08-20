import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { OtpModule } from '../otp/otp.module';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [OtpModule, CommunicationModule],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
