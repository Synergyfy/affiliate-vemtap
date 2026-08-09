import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { AgentsModule } from './agents/agents.module';
import { OperationsModule } from './operations/operations.module';
import { SalesWorkSessionModule } from './sales-work-session/sales-work-session.module';
import { ObservabilityModule } from './observability/observability.module';
import { RequestIdMiddleware } from './observability/request-id.middleware';
import { MetricsMiddleware } from './observability/metrics.middleware';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { MarketMappingModule } from './market-mapping/market-mapping.module';
import { SupportModule } from './support/support.module';
import { FaqsModule } from './faqs/faqs.module';
import { WorkSessionsModule } from './work-sessions/work-sessions.module';
import { ExceptionsModule } from './exceptions/exceptions.module';
import { PerformanceModule } from './performance/performance.module';
import { AnomaliesModule } from './anomalies/anomalies.module';

import { FieldActivityModule } from './field-activity/field-activity.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    ShortLinksModule,
    LeadsModule,
    AgentsModule,
    OperationsModule,
    SalesWorkSessionModule,
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
    MarketMappingModule,
    SupportModule,
    FaqsModule,
    WorkSessionsModule,
    ExceptionsModule,
    PerformanceModule,
    AnomaliesModule,
    FieldActivityModule,
    SalesModule,
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
