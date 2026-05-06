import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { BroadcastRecipientType, NotificationChannel } from './dto/notification.dto';
import { ResendService } from '../otp/resend.service';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resendService: ResendService,
    private readonly pushService: PushService,
  ) {}

  async findAllAdmin(pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true } } },
      }),
      this.prisma.notification.count(),
    ]);
    return { data, total };
  }

  async create(data: { userId?: string; type: NotificationType; title: string; message: string; data?: any }) {
    return this.prisma.notification.create({
      data,
    });
  }

  async broadcast(
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    recipients: BroadcastRecipientType = BroadcastRecipientType.ALL,
    channels: NotificationChannel[] = [NotificationChannel.IN_APP],
  ) {
    // 1. Filter Users
    const where: any = { status: 'ACTIVE' };

    if (recipients === BroadcastRecipientType.TOP_EARNERS) {
      where.totalEarnings = { gte: 10000 };
    } else if (recipients === BroadcastRecipientType.MANAGERS) {
      where.OR = [
        { referralCount: { gte: 10 } },
        { isManagerMode: true },
      ];
    } else if (recipients === BroadcastRecipientType.NEW_AFFILIATES) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.createdAt = { gte: sevenDaysAgo };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true, email: true },
    });

    const userIds = users.map((u) => u.id);
    const emails = users.map((u) => u.email);

    const results: any = {};

    // 2. Dispatch Channels
    if (channels.includes(NotificationChannel.IN_APP)) {
      const notifications = userIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        data,
      }));
      results.inApp = await this.prisma.notification.createMany({ data: notifications });
    }

    if (channels.includes(NotificationChannel.EMAIL)) {
      results.email = await this.resendService.sendBroadcastEmail(emails, title, message);
    }

    if (channels.includes(NotificationChannel.PUSH)) {
      results.push = await this.pushService.broadcastPush(userIds, title, message, data);
    }

    return {
      recipientCount: users.length,
      results,
    };
  }

  async findUserNotifications(userId: string, pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { data, total };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
