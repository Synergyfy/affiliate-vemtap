import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ShortLinksService } from './short-links.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ShortLinksService', () => {
  let service: ShortLinksService;
  let prisma: PrismaService;

  const mockPrisma = {
    shortLink: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    linkClick: {
      count: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('https://vemtap.link'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortLinksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<ShortLinksService>(ShortLinksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { code: 'my-link' };
    const userId = 'user-1';

    it('should create a short link if code is unique', async () => {
      mockPrisma.shortLink.findUnique.mockResolvedValue(null);
      mockPrisma.shortLink.create.mockResolvedValue({ id: 'sl-1', code: 'my-link', userId });

      const result = await service.create(userId, dto);

      expect(result.code).toBe('my-link');
      expect(result.fullUrl).toBe('https://vemtap.link/my-link');
      expect(prisma.shortLink.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if code exists', async () => {
      mockPrisma.shortLink.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.create(userId, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return short links with click counts', async () => {
      const userId = 'user-1';
      mockPrisma.shortLink.findMany.mockResolvedValue([
        { code: 'link1', userId },
        { code: 'link2', userId },
      ]);
      mockPrisma.linkClick.count.mockResolvedValue(5);

      const result = await service.findAll(userId);

      expect(result.length).toBe(2);
      expect(result[0].clickCount).toBe(5);
      expect(prisma.linkClick.count).toHaveBeenCalledTimes(2);
    });
  });

  describe('remove', () => {
    it('should delete if owned by user', async () => {
      const userId = 'user-1';
      mockPrisma.shortLink.findUnique.mockResolvedValue({ id: 'sl-1', userId });
      mockPrisma.shortLink.delete.mockResolvedValue({ id: 'sl-1' });

      await service.remove(userId, 'sl-1');
      expect(prisma.shortLink.delete).toHaveBeenCalledWith({ where: { id: 'sl-1' } });
    });

    it('should throw NotFoundException if not owned or not found', async () => {
      mockPrisma.shortLink.findUnique.mockResolvedValue({ id: 'sl-1', userId: 'other' });
      await expect(service.remove('user-1', 'sl-1')).rejects.toThrow(NotFoundException);
    });
  });
});
