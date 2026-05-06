import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor() {
    this.logger.warn('PushService is currently stubbed. Firebase Admin SDK not integrated.');
  }

  async sendPush(userId: string, title: string, body: string, data?: any): Promise<boolean> {
    this.logger.log(`[Stub] Sending push notification to user ${userId}: ${title}`);
    // In a real implementation, we would fetch the user's FCM token from DB
    // and use firebase-admin to send the message.
    return true;
  }

  async broadcastPush(userIds: string[], title: string, body: string, data?: any): Promise<boolean> {
    this.logger.log(`[Stub] Broadcasting push notification to ${userIds.length} users: ${title}`);
    return true;
  }
}
