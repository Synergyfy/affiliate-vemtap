import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { OtpModule } from '../otp/otp.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, PaymentsModule, OtpModule, StorageModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
