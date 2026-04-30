import { Module } from '@nestjs/common';
import { ExternalService } from './external.service';
import { ExternalController } from './external.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

@Module({
  imports: [
    ApiKeysModule,       // Provides ApiKeysService (needed by ApiKeyGuard)
    BusinessesModule,    // Provides BusinessesService (commission generation)
    WithdrawalsModule,   // Provides WithdrawalsService (withdrawal creation)
  ],
  providers: [ExternalService, ApiKeyGuard],
  controllers: [ExternalController],
})
export class ExternalModule {}
