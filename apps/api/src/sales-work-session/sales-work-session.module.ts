import { Module } from '@nestjs/common';
import { SalesWorkSessionController } from './sales-work-session.controller';
import { SalesWorkSessionService } from './sales-work-session.service';

@Module({
  controllers: [SalesWorkSessionController],
  providers: [SalesWorkSessionService],
  exports: [SalesWorkSessionService],
})
export class SalesWorkSessionModule {}
