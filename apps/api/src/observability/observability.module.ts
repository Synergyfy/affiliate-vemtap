import { Module } from '@nestjs/common';
import { ObservabilityController } from './observability.controller';
import { ObservabilityStoreService } from './observability.store';
import { ObservabilityLoggingInterceptor } from './observability.interceptor';

@Module({
  controllers: [ObservabilityController],
  providers: [ObservabilityStoreService, ObservabilityLoggingInterceptor],
  exports: [ObservabilityStoreService, ObservabilityLoggingInterceptor],
})
export class ObservabilityModule {}
