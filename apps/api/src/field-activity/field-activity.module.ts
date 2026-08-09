import { Module } from '@nestjs/common';
import { FieldActivityController } from './field-activity.controller';
import { FieldActivityService } from './field-activity.service';

@Module({
  controllers: [FieldActivityController],
  providers: [FieldActivityService],
  exports: [FieldActivityService],
})
export class FieldActivityModule {}
