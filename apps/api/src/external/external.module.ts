import { Module } from '@nestjs/common';
import { ExternalService } from './external.service';
import { ExternalController } from './external.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@Module({
  imports: [
    ApiKeysModule,       // Provides ApiKeysService (needed by ApiKeyGuard)
    BusinessesModule,    // Provides BusinessesService (commission generation)
  ],
  providers: [ExternalService, ApiKeyGuard, RateLimitGuard],
  controllers: [ExternalController],
})
export class ExternalModule {}
