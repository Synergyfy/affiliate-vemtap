import { Test, TestingModule } from '@nestjs/testing';
import { TrainingService } from './training.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TrainingService', () => {
  let service: TrainingService;

  const mockPrisma = {
    trainingModule: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    trainingProgress: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TrainingService>(TrainingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createModule', () => {
    it('should create a module with pdfUrl and scenarios with options', async () => {
      const moduleData = {
        title: 'New Module',
        description: 'Desc',
        content: 'Content',
        order: 1,
        category: 'Sales',
        pdfUrl: 'https://example.com/guide.pdf',
        scenarios: [
          {
            title: 'Test Scenario',
            situation: 'Sit',
            objection: 'Obj',
            idealResponse: 'Response',
            options: ['Opt 1', 'Opt 2'],
            correctAnswerIndex: 0,
            order: 1,
          },
        ],
      };

      mockPrisma.trainingModule.create.mockResolvedValue({
        id: 'module-id',
        ...moduleData,
      });

      const result = await service.createModule(moduleData);

      expect(mockPrisma.trainingModule.create).toHaveBeenCalledWith({
        data: {
          ...moduleData,
          quizzes: undefined,
          scenarios: { create: moduleData.scenarios },
        },
      });
      expect(result.pdfUrl).toBe(moduleData.pdfUrl);
    });
  });

  describe('findModuleDetailsAdmin', () => {
    it('should return module details with scenarios', async () => {
      const moduleId = 'module-id';
      const mockModule = {
        id: moduleId,
        title: 'Test',
        pdfUrl: 'https://test.com/pdf',
        scenarios: [
          {
            id: 'scenario-id',
            options: ['A', 'B'],
            correctAnswerIndex: 0,
          },
        ],
      };

      mockPrisma.trainingModule.findUnique.mockResolvedValue(mockModule);

      const result = await service.findModuleDetailsAdmin(moduleId);

      expect(mockPrisma.trainingModule.findUnique).toHaveBeenCalled();
      expect(result.pdfUrl).toBe('https://test.com/pdf');
      expect(result.scenarios[0].options).toEqual(['A', 'B']);
    });

    it('should throw NotFoundException if module not found', async () => {
      mockPrisma.trainingModule.findUnique.mockResolvedValue(null);
      await expect(service.findModuleDetailsAdmin('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
