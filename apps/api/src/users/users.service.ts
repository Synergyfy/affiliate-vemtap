import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, phone, password, referralCode: sponsorCode, ...rest } = createUserDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique referral code (e.g., VEM-XXXXXX)
    const uniqueReferralCode = await this.generateUniqueReferralCode();

    // Check sponsor if provided
    let referrerId: string | null = null;
    if (sponsorCode) {
      const sponsor = await this.prisma.user.findUnique({
        where: { referralCode: sponsorCode },
      });
      if (sponsor) {
        referrerId = sponsor.id;
      }
    }

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        email,
        phone,
        password: hashedPassword,
        referralCode: uniqueReferralCode,
        referredBy: sponsorCode,
        referrerId,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const { password: _, ...result } = user;
    return result;
  }

  async update(userId: string, dto: any): Promise<Omit<User, 'password'>> {
    const data = { ...dto };

    // Check if phone or email is being updated and if it conflicts
    if (data.phone || data.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            { OR: [
              data.email ? { email: data.email } : {},
              data.phone ? { phone: data.phone } : {},
            ].filter(q => Object.keys(q).length > 0) }
          ]
        },
      });

      if (existing) {
        throw new ConflictException('Email or phone already in use');
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    const { password: _, ...result } = user;
    return result;
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async findAllAdmin(pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          role: true,
          status: true,
          kycStatus: true,
          referralCode: true,
          createdAt: true,
          totalEarnings: true,
        },
      }),
      this.prisma.user.count(),
    ]);
    return { data, total };
  }

  async findOneAdmin(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        referrer: {
          select: { id: true, fullName: true, referralCode: true },
        },
        _count: {
          select: { referrals: true, businesses: true },
        },
      },
    });
    if (!user) return null;
    const { password: _, ...result } = user;
    return result;
  }

  async updateStatus(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data: { status: data.status },
    });
  }

  async updateKyc(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data: { kycStatus: data.status },
    });
  }

  private async generateUniqueReferralCode(): Promise<string> {
    let code: string;
    let exists = true;
    
    while (exists) {
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      code = `VEM-${randomStr}`;
      const user = await this.prisma.user.findUnique({
        where: { referralCode: code },
      });
      if (!user) exists = false;
    }
    
    return code!;
  }
}
