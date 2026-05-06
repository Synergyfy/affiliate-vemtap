import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from '../payments/paystack.service';
import { OtpService } from '../otp/otp.service';
import { ResendService } from '../otp/resend.service';
import { Tier } from '@prisma/client';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let otpService: OtpService;
  let resendService: ResendService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockPaystack = {};
  const mockOtp = {
    generateOtp: jest.fn().mockReturnValue('123456'),
    isExpired: jest.fn().mockReturnValue(false),
  };
  const mockResend = {
    sendOtpEmail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaystackService, useValue: mockPaystack },
        { provide: OtpService, useValue: mockOtp },
        { provide: ResendService, useValue: mockResend },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    otpService = module.get<OtpService>(OtpService);
    resendService = module.get<ResendService>(ResendService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateTier', () => {
    it('should return BRONZE for 0-10 referrals', () => {
      expect((service as any).calculateTier(0)).toBe(Tier.BRONZE);
      expect((service as any).calculateTier(10)).toBe(Tier.BRONZE);
    });

    it('should return SILVER for 11-50 referrals', () => {
      expect((service as any).calculateTier(11)).toBe(Tier.SILVER);
      expect((service as any).calculateTier(50)).toBe(Tier.SILVER);
    });

    it('should return GOLD for 51+ referrals', () => {
      expect((service as any).calculateTier(51)).toBe(Tier.GOLD);
      expect((service as any).calculateTier(100)).toBe(Tier.GOLD);
    });
  });

  describe('requestEmailUpdate', () => {
    it('should throw if email already in use', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: '1' }); // for user check
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: '2' }); // for existing email check
      
      await expect(service.requestEmailUpdate('1', 'used@email.com')).rejects.toThrow(ConflictException);
    });

    it('should generate code and send email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: '1' });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValue({});
      
      const result = await service.requestEmailUpdate('1', 'new@email.com');
      
      expect(result.message).toBeDefined();
      expect(mockOtp.generateOtp).toHaveBeenCalled();
      expect(mockResend.sendOtpEmail).toHaveBeenCalledWith('new@email.com', '123456');
    });
  });
});
