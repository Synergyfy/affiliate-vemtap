import { Module } from '@nestjs/common';
import { ShortLinksService } from './short-links.service';
import { ShortLinksController } from './short-links.controller';

@Module({
  providers: [ShortLinksService],
  controllers: [ShortLinksController],
  exports: [ShortLinksService],
})
export class ShortLinksModule {}
