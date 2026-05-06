import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ToolsModule } from './tools/tools.module';
import { BusinessesModule } from './businesses/businesses.module';
import { NetworkModule } from './network/network.module';
import { CommissionsModule } from './commissions/commissions.module';
import { IntegrationModule } from './integration/integration.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FraudModule } from './fraud/fraud.module';
import { TrainingModule } from './training/training.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PaymentsModule } from './payments/payments.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ExternalModule } from './external/external.module';
import { StorageModule } from './storage/storage.module';
import { OtpModule } from './otp/otp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    ToolsModule,
    BusinessesModule,
    NetworkModule,
    CommissionsModule,
    IntegrationModule,
    WithdrawalsModule,
    DashboardModule,
    FraudModule,
    TrainingModule,
    NotificationsModule,
    SettingsModule,
    TransactionsModule,
    PaymentsModule,
    ApiKeysModule,
    ExternalModule,
    StorageModule,
    OtpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
