import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TrackingService', () => {
  let service: TrackingService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    shortLink: { findUnique: jest.fn() },
    linkClick: { create: jest.fn() },
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<TrackingService>(TrackingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('notifyClick', () => {
    const validDto = {
      referralCode: 'REF123',
      secret: 'test-secret',
      ip: '127.0.0.1',
    };

    it('should throw UnauthorizedException if secret is invalid', async () => {
      await expect(
        service.notifyClick({ ...validDto, secret: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should attribute click to user via referral code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-id' });
      mockPrisma.linkClick.create.mockResolvedValue({ id: 'click-id' });

      await service.notifyClick(validDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { referralCode: 'REF123' },
        select: { id: true },
      });
      expect(prisma.linkClick.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-id' }),
        }),
      );
    });

    it('should attribute click to user via short link code if referral code is missing', async () => {
      const shortLinkDto = {
        shortLinkCode: 'abc',
        secret: 'test-secret',
      };
      mockPrisma.shortLink.findUnique.mockResolvedValue({ userId: 'user-id-from-sl' });
      mockPrisma.linkClick.create.mockResolvedValue({ id: 'click-id' });

      await service.notifyClick(shortLinkDto);

      expect(prisma.shortLink.findUnique).toHaveBeenCalledWith({
        where: { code: 'abc' },
        select: { userId: true },
      });
      expect(prisma.linkClick.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-id-from-sl' }),
        }),
      );
    });

    it('should record click even if user is not found (anonymous click)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.linkClick.create.mockResolvedValue({ id: 'click-id' });

      await service.notifyClick(validDto);

      expect(prisma.linkClick.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: null }),
        }),
      );
    });
  });
});
