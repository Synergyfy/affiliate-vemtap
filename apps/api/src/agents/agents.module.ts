import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

@Module({
  imports: [ApiKeysModule],
  controllers: [AgentsController],
  providers: [AgentsService, ApiKeyGuard],
  exports: [AgentsService],
})
export class AgentsModule {}
