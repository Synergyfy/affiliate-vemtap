import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
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
import { AgreementsModule } from './agreements/agreements.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PaymentsModule } from './payments/payments.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ExternalModule } from './external/external.module';
import { StorageModule } from './storage/storage.module';
import { OtpModule } from './otp/otp.module';
import { TrackingModule } from './tracking/tracking.module';
import { ShortLinksModule } from './tools/short-links/short-links.module';
import { LeadsModule } from './leads/leads.module';
import { OperationsModule } from './operations/operations.module';
import { ObservabilityModule } from './observability/observability.module';
import { RequestIdMiddleware } from './observability/request-id.middleware';
import { MetricsMiddleware } from './observability/metrics.middleware';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

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
    ShortLinksModule,
    LeadsModule,
    OperationsModule,
    ObservabilityModule,
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
    AgreementsModule,
    TransactionsModule,
    PaymentsModule,
    ApiKeysModule,
    ExternalModule,
    StorageModule,
    OtpModule,
    TrackingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, MetricsMiddleware, LoggerMiddleware)
      .forRoutes('*');
  }
}
