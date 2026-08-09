import { Test, TestingModule } from '@nestjs/testing';
import { PushService } from './push.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

describe('PushService', () => {
  let service: PushService;
  let prisma: PrismaService;
  let webpushMock: jest.Mocked<typeof webpush>;

  const configFor = (values: Record<string, string>) => ({
    get: jest.fn((key: string) => values[key]),
  });

  const subscriptions = [
    { id: 'sub-1', userId: 'u1', endpoint: 'https://push.example/1', p256dh: 'p1', auth: 'a1', userAgent: null },
    { id: 'sub-2', userId: 'u1', endpoint: 'https://push.example/2', p256dh: 'p2', auth: 'a2', userAgent: null },
  ];

  beforeEach(async () => {
    webpushMock = webpush as jest.Mocked<typeof webpush>;
    jest.clearAllMocks();
  });

  const buildModule = async (env: Record<string, string>, findManyResult: any[] = []) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: ConfigService, useValue: configFor(env) },
        {
          provide: PrismaService,
          useValue: {
            pushSubscription: {
              findMany: jest.fn().mockResolvedValue(findManyResult),
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PushService>(PushService);
    prisma = module.get<PrismaService>(PrismaService);
  };

  it('does not send when VAPID keys are missing and returns false', async () => {
    await buildModule({});
    const result = await service.sendPush('u1', 'Title', 'Body');
    expect(result).toBe(false);
    expect(prisma.pushSubscription.findMany).not.toHaveBeenCalled();
    expect(webpushMock.sendNotification).not.toHaveBeenCalled();
  });

  it('sends to every stored subscription and returns true', async () => {
    webpushMock.sendNotification.mockResolvedValue(undefined as any);
    await buildModule(
      { VAPID_PUBLIC_KEY: 'pk', VAPID_PRIVATE_KEY: 'sk', VAPID_SUBJECT: 'mailto:test@vemtap.com' },
      subscriptions,
    );

    const result = await service.sendPush('u1', 'Reminder', 'Body text', { url: '/dashboard' });

    expect(result).toBe(true);
    expect(webpushMock.setVapidDetails).toHaveBeenCalledWith('mailto:test@vemtap.com', 'pk', 'sk');
    expect(webpushMock.sendNotification).toHaveBeenCalledTimes(2);
    expect(webpushMock.sendNotification).toHaveBeenCalledWith(
      { endpoint: 'https://push.example/1', keys: { p256dh: 'p1', auth: 'a1' } },
      JSON.stringify({ title: 'Reminder', body: 'Body text', data: { url: '/dashboard' } }),
    );
  });

  it('prunes subscriptions that respond 404/410 and still reports sent for the rest', async () => {
    webpushMock.sendNotification
      .mockResolvedValueOnce(undefined as any)
      .mockRejectedValueOnce({ statusCode: 410 });
    await buildModule(
      { VAPID_PUBLIC_KEY: 'pk', VAPID_PRIVATE_KEY: 'sk', VAPID_SUBJECT: 'mailto:test@vemtap.com' },
      subscriptions,
    );

    const result = await service.sendPush('u1', 'Reminder', 'Body');

    expect(result).toBe(true);
    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { id: 'sub-2' } });
  });

  it('broadcastPush aggregates deliveries across users', async () => {
    webpushMock.sendNotification.mockResolvedValue(undefined as any);
    (webpushMock.setVapidDetails as jest.Mock).mockImplementation(() => undefined);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: ConfigService, useValue: configFor({ VAPID_PUBLIC_KEY: 'pk', VAPID_PRIVATE_KEY: 'sk' }) },
        {
          provide: PrismaService,
          useValue: {
            pushSubscription: {
              findMany: jest.fn().mockResolvedValue(subscriptions.slice(0, 1)),
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PushService>(PushService);
    prisma = module.get<PrismaService>(PrismaService);

    const result = await service.broadcastPush(['u1', 'u2'], 'Reminder', 'Body');

    expect(result).toBe(2);
    expect(prisma.pushSubscription.findMany).toHaveBeenCalledTimes(2);
  });
});
