import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentsQueryDto } from './dto/agents-query.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import {
  AgentListResponseDto,
  AgentResponseDto,
  AgentDetailResponseDto,
  RevenueTrendResponseDto,
  MonthRevenueDto,
} from './dto/agent-response.dto';
import { Role, UserStatus, BusinessStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AgentsQueryDto): Promise<AgentListResponseDto> {
    const where = this.buildWhereClause(query);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          referrerId: true,
          referrer: { select: { fullName: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const agentIds = users.map((u) => u.id);
    const businessAggs = agentIds.length > 0
      ? await this.prisma.business.groupBy({
          by: ['affiliateId'],
          where: { affiliateId: { in: agentIds }, status: BusinessStatus.ACTIVE },
          _count: { id: true },
          _sum: { subscriptionAmount: true, commissionAmount: true },
        })
      : [];

    const aggMap = new Map(businessAggs.map((a) => [a.affiliateId, a]));

    return {
      agents: users.map((u) => this.mapToAgentResponse(u, aggMap.get(u.id))),
      total,
    };
  }

  async findOne(id: string): Promise<AgentDetailResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        referrerId: true,
        referrer: { select: { fullName: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Agent not found');
    }

    const [subordinates, businesses, businessAgg] = await Promise.all([
      this.prisma.user.findMany({
        where: { referrerId: id },
        select: { id: true, fullName: true, email: true },
      }),
      this.prisma.business.findMany({
        where: { affiliateId: id, status: BusinessStatus.ACTIVE },
        select: {
          id: true,
          businessName: true,
          planType: true,
          subscriptionAmount: true,
          commissionAmount: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.business.aggregate({
        where: { affiliateId: id, status: BusinessStatus.ACTIVE },
        _count: { id: true },
        _sum: { subscriptionAmount: true, commissionAmount: true },
      }),
    ]);

    return {
      ...this.mapToAgentResponse(user, businessAgg),
      subordinates: subordinates.map((s) => ({
        id: s.id,
        name: s.fullName,
        email: s.email,
      })),
      businesses: businesses.map((b) => ({
        id: b.id,
        name: b.businessName,
        plan: b.planType,
        mrr: Number(b.subscriptionAmount),
        status: b.status,
      })),
    };
  }

  async getRevenueTrend(id: string): Promise<RevenueTrendResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      throw new NotFoundException('Agent not found');
    }

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const businesses = await this.prisma.business.findMany({
      where: {
        affiliateId: id,
        status: BusinessStatus.ACTIVE,
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true, subscriptionAmount: true },
      orderBy: { createdAt: 'asc' },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthsMap = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsMap.set(key, 0);
    }

    for (const b of businesses) {
      const key = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthsMap.has(key)) {
        monthsMap.set(key, monthsMap.get(key)! + Number(b.subscriptionAmount));
      }
    }

    const months: MonthRevenueDto[] = [];
    for (const [key, revenue] of monthsMap) {
      const date = new Date(key + '-01');
      months.push({
        month: monthNames[date.getMonth()],
        revenue,
      });
    }

    return { months };
  }

  async create(dto: CreateAgentDto): Promise<AgentDetailResponseDto> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (existing) {
      throw new ConflictException('Agent with this email or phone already exists');
    }

    const password = dto.password || await this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const referralCode = await this.generateUniqueReferralCode();

    let referrerId: string | null = null;
    if (dto.managerId) {
      const manager = await this.prisma.user.findUnique({ where: { id: dto.managerId } });
      if (manager) {
        referrerId = manager.id;
      }
    }

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        referralCode,
        referrerId,
        role: Role.AGENT,
        status: dto.status || UserStatus.ACTIVE,
      },
    });

    return this.findOne(user.id);
  }

  async update(id: string, dto: UpdateAgentDto): Promise<AgentDetailResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Agent not found');
    }

    if (dto.email || dto.phone) {
      const existing = await this.prisma.user.findFirst({
        where: {
          OR: [
            ...(dto.email ? [{ email: dto.email }] : []),
            ...(dto.phone ? [{ phone: dto.phone }] : []),
          ],
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Email or phone already in use');
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.fullName = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.managerId !== undefined) {
      data.referrer = dto.managerId
        ? { connect: { id: dto.managerId } }
        : { disconnect: true };
    }
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    await this.prisma.user.update({ where: { id }, data });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Agent not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.DEACTIVATED },
    });
  }

  private buildWhereClause(query: AgentsQueryDto): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      role: { not: Role.ADMIN },
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private mapToAgentResponse(
    user: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
      status: UserStatus;
      createdAt: Date;
      referrerId: string | null;
      referrer: { fullName: string } | null;
    },
    businessAgg: { _count: { id: number }; _sum: { subscriptionAmount: any; commissionAmount: any } } | undefined,
  ): AgentResponseDto {
    const managedMrr = Number(businessAgg?._sum?.subscriptionAmount || 0);

    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      dateJoined: user.createdAt,
      managerId: user.referrerId ?? null,
      managerName: user.referrer?.fullName ?? null,
      businessesCount: businessAgg?._count?.id ?? 0,
      managedMrr,
      commissionEarned: Number(businessAgg?._sum?.commissionAmount || 0),
    };
  }

  private async generateUniqueReferralCode(): Promise<string> {
    let code: string;
    let exists = true;
    while (exists) {
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      code = `VEM-${randomStr}`;
      const user = await this.prisma.user.findUnique({ where: { referralCode: code } });
      if (!user) exists = false;
    }
    return code!;
  }

  private async generateRandomPassword(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
