import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResendService } from '../otp/resend.service';
import { PushService } from './push.service';
import { NotificationsGateway } from './notifications.gateway';
import { BroadcastRecipientType, NotificationChannel } from './dto/notification.dto';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let resendService: ResendService;
  let pushService: PushService;
  let gateway: NotificationsGateway;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            notification: {
              createMany: jest.fn().mockResolvedValue({ count: 0 }),
              create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
              count: jest.fn().mockResolvedValue(0),
            },
            pushSubscription: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: ResendService,
          useValue: {
            sendBroadcastEmail: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: PushService,
          useValue: {
            broadcastPush: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: NotificationsGateway,
          useValue: {
            emitToUser: jest.fn(),
            emitToUsers: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleFixture.get<NotificationsService>(NotificationsService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    resendService = moduleFixture.get<ResendService>(ResendService);
    pushService = moduleFixture.get<PushService>(PushService);
    gateway = moduleFixture.get<NotificationsGateway>(NotificationsGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('broadcast', () => {
    it('should filter for TOP_EARNERS', async () => {
      await service.broadcast(
        NotificationType.SYSTEM,
        'Title',
        'Message',
        {},
        BroadcastRecipientType.TOP_EARNERS,
      );

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            totalEarnings: { gte: 10000 },
          }),
        }),
      );
    });

    it('should filter for MANAGERS', async () => {
      await service.broadcast(
        NotificationType.SYSTEM,
        'Title',
        'Message',
        {},
        BroadcastRecipientType.MANAGERS,
      );

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { referralCount: { gte: 10 } },
              { role: { in: ['SUPERVISOR', 'MANAGER'] } },
            ],
          }),
        }),
      );
    });

    it('should filter for NEW_AFFILIATES', async () => {
      await service.broadcast(
        NotificationType.SYSTEM,
        'Title',
        'Message',
        {},
        BroadcastRecipientType.NEW_AFFILIATES,
      );

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should dispatch to all channels', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([
        { id: '1', email: 'user1@example.com' },
      ] as any);

      const channels = [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH];
      await service.broadcast(
        NotificationType.SYSTEM,
        'Title',
        'Message',
        {},
        BroadcastRecipientType.ALL,
        channels,
      );

      expect(prisma.notification.createMany).toHaveBeenCalled();
      expect(resendService.sendBroadcastEmail).toHaveBeenCalledWith(['user1@example.com'], 'Title', 'Message');
      expect(pushService.broadcastPush).toHaveBeenCalledWith(['1'], 'Title', 'Message', {});
    });
  });

  describe('create', () => {
    it('persists the notification and emits a real-time event for the user', async () => {
      const created = { id: 'notif-1', userId: 'u1' };
      jest.spyOn(prisma.notification, 'create').mockResolvedValue(created as any);
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(0);

      await service.create({ userId: 'u1', type: NotificationType.SYSTEM, title: 'Hi', message: 'Body' });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId: 'u1', type: NotificationType.SYSTEM, title: 'Hi', message: 'Body' },
      });
      expect(gateway.emitToUser).toHaveBeenCalledWith('u1', 'notification:new', created);
      expect(gateway.emitToUser).toHaveBeenCalledWith('u1', 'notification:unread', { unreadCount: 0 });
    });
  });

  describe('push subscriptions', () => {
    it('creates a new push subscription when none exists for the endpoint', async () => {
      jest.spyOn(prisma.pushSubscription, 'findUnique').mockResolvedValue(null);
      const created = { id: 'sub-1' };
      jest.spyOn(prisma.pushSubscription, 'create').mockResolvedValue(created as any);

      const result = await service.savePushSubscription('u1', {
        endpoint: 'https://push.example/1',
        p256dh: 'p1',
        auth: 'a1',
      });

      expect(prisma.pushSubscription.create).toHaveBeenCalledWith({
        data: { userId: 'u1', endpoint: 'https://push.example/1', p256dh: 'p1', auth: 'a1', userAgent: undefined },
      });
      expect(result).toEqual(created);
    });

    it('updates an existing subscription for the same endpoint', async () => {
      jest.spyOn(prisma.pushSubscription, 'findUnique').mockResolvedValue({ id: 'sub-1' } as any);
      const updated = { id: 'sub-1', p256dh: 'p1-new', auth: 'a1-new' };
      jest.spyOn(prisma.pushSubscription, 'update').mockResolvedValue(updated as any);

      const result = await service.savePushSubscription('u1', {
        endpoint: 'https://push.example/1',
        p256dh: 'p1-new',
        auth: 'a1-new',
      });

      expect(prisma.pushSubscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { userId: 'u1', p256dh: 'p1-new', auth: 'a1-new', userAgent: undefined },
      });
      expect(result).toEqual(updated);
    });

    it('removes a push subscription for the user', async () => {
      jest.spyOn(prisma.pushSubscription, 'deleteMany').mockResolvedValue({ count: 1 } as any);

      const result = await service.removePushSubscription('u1', 'https://push.example/1');

      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', endpoint: 'https://push.example/1' },
      });
      expect(result).toEqual({ count: 1 });
    });
  });
});
