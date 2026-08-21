import { Module } from '@nestjs/common';
import { FieldActivityController } from './field-activity.controller';
import { FieldActivityService } from './field-activity.service';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [CommunicationModule],
  controllers: [FieldActivityController],
  providers: [FieldActivityService],
  exports: [FieldActivityService],
})
export class FieldActivityModule {}
