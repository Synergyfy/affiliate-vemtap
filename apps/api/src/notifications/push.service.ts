import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private initialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      this.configService.get<string>('VAPID_SUBJECT') || 'mailto:support@vemtap.com';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.initialized = true;
    } else {
      this.logger.warn(
        'VAPID keys are not configured. Push notifications will be disabled.',
      );
    }
  }

  private async sendToSubscriptions(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<number> {
    if (!this.initialized) {
      this.logger.warn(`[Push] VAPID not configured; skipping push to user ${userId}`);
      return 0;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });
    if (subscriptions.length === 0) return 0;

    const payload = JSON.stringify({ title, body, data: data ?? {} });
    let sent = 0;

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
        );
        sent++;
      } catch (err: any) {
        this.logger.warn(
          `[Push] Failed to deliver to ${subscription.endpoint}: ${err?.message}`,
        );
        // 404/410 means the subscription is no longer valid — drop it.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await this.prisma.pushSubscription.deleteMany({
            where: { id: subscription.id },
          });
        }
      }
    }

    return sent;
  }

  async sendPush(userId: string, title: string, body: string, data?: any): Promise<boolean> {
    const sent = await this.sendToSubscriptions(userId, title, body, data);
    return sent > 0;
  }

  async broadcastPush(userIds: string[], title: string, body: string, data?: any): Promise<number> {
    if (!this.initialized || userIds.length === 0) return 0;
    let totalSent = 0;
    for (const userId of userIds) {
      totalSent += await this.sendToSubscriptions(userId, title, body, data);
    }
    return totalSent;
  }
}
