import { Module } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [PaystackService],
  exports: [PaystackService],
})
export class PaymentsModule {}
