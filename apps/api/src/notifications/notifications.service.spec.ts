import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResendService } from '../otp/resend.service';
import { PushService } from './push.service';
import { BroadcastRecipientType, NotificationChannel } from './dto/notification.dto';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let resendService: ResendService;
  let pushService: PushService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
            broadcastPush: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    resendService = module.get<ResendService>(ResendService);
    pushService = module.get<PushService>(PushService);
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
              { isManagerMode: true },
            ],
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
});
