import { Module } from '@nestjs/common';
import { TemplatesController } from './templates/templates.controller';
import { TemplatesService } from './templates/templates.service';
import { AudienceController } from './audience/audience.controller';
import { AudienceService } from './audience/audience.service';
import { MessagesController } from './messages/messages.controller';
import { MessagesService } from './messages/messages.service';
import { WhatsAppController } from './whatsapp/whatsapp.controller';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { SmsController } from './sms/sms.controller';
import { SmsService } from './sms/sms.service';
import { RulesController } from './rules/rules.controller';
import { RulesService } from './rules/rules.service';
import { CampaignsController } from './campaigns/campaigns.controller';
import { CampaignsService } from './campaigns/campaigns.service';
import { CommunicationSettingsController } from './settings/communication-settings.controller';
import { CommunicationSettingsService } from './settings/communication-settings.service';
import { SalesViewController } from './sales-view/sales-view.controller';
import { SalesViewService } from './sales-view/sales-view.service';
import { ReportingController } from './reporting/reporting.controller';
import { ReportingService } from './reporting/reporting.service';
import { JourneyService } from './engine/journey.service';
import { JourneyController } from './journey/journey.controller';
import { JourneyService as JourneyConfigService } from './journey/journey.service';
import { EngineService } from './engine/engine.service';
import { EngineProcessor } from './engine/engine.processor';
import { MessageRendererService } from './common/message-renderer.service';
import { DisabledSmsProvider } from './sms/providers/disabled-sms.provider';

@Module({
  controllers: [
    TemplatesController,
    AudienceController,
    MessagesController,
    WhatsAppController,
    SmsController,
    RulesController,
    CampaignsController,
    CommunicationSettingsController,
    SalesViewController,
    ReportingController,
    JourneyController,
  ],
  providers: [
    TemplatesService,
    AudienceService,
    MessagesService,
    WhatsAppService,
    SmsService,
    RulesService,
    CampaignsService,
    CommunicationSettingsService,
    SalesViewService,
    ReportingService,
    JourneyService,
    EngineService,
    EngineProcessor,
    MessageRendererService,
    DisabledSmsProvider,
    JourneyConfigService,
  ],
  exports: [
    EngineService,
    MessagesService,
    CommunicationSettingsService,
    JourneyService,
    JourneyConfigService,
  ],
})
export class CommunicationModule {}
