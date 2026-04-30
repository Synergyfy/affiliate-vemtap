import { Test, TestingModule } from '@nestjs/testing';
import { ToolsService } from './tools.service';
import { PrismaService } from '../prisma/prisma.service';
import { ToolType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('ToolsService', () => {
  let service: ToolsService;
  let prisma: PrismaService;

  const mockPrisma = {
    marketingTool: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ToolsService>(ToolsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return published tools by default', async () => {
      mockPrisma.marketingTool.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prisma.marketingTool.findMany).toHaveBeenCalledWith({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return all tools if specified', async () => {
      mockPrisma.marketingTool.findMany.mockResolvedValue([]);
      await service.findAll(false);
      expect(prisma.marketingTool.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a tool if found', async () => {
      const tool = { id: '1', title: 'Test' };
      mockPrisma.marketingTool.findUnique.mockResolvedValue(tool);
      const result = await service.findOne('1');
      expect(result).toEqual(tool);
    });

    it('should throw NotFoundException if tool not found', async () => {
      mockPrisma.marketingTool.findUnique.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new tool', async () => {
      const dto = { title: 'New Tool', type: ToolType.BANNER, content: 'url' };
      mockPrisma.marketingTool.create.mockResolvedValue({ id: '1', ...dto });
      const result = await service.create(dto);
      expect(result).toHaveProperty('id');
      expect(prisma.marketingTool.create).toHaveBeenCalledWith({ data: dto });
    });
  });
});
