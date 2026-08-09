import { Injectable, ConflictException, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { CreateUserAdminDto } from "./dto/create-user-admin.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import * as bcrypt from "bcryptjs";
import { User, Tier, Role, UserStatus, KycStatus, Prisma } from "@prisma/client";
import { PaystackService } from "../payments/paystack.service";
import { OtpService } from "../otp/otp.service";
import { ResendService } from "../otp/resend.service";
import { UserFilterDto } from "./dto/user-filter.dto";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
    private readonly otpService: OtpService,
    private readonly resendService: ResendService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, "password">> {
    const {
      email,
      phone,
      password,
      referralCode: sponsorCode,
      ...rest
    } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        "User with this email or phone already exists",
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uniqueReferralCode = await this.generateUniqueReferralCode();

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
        tier: Tier.BRONZE,
      },
    });

    const { password: _password, ...result } = user;
    return result;
  }

  async createUserByAdmin(dto: CreateUserAdminDto): Promise<Omit<User, 'password'>> {
    const { email, phone, password, role, dailyLeadTarget, monthlyConversionTarget, supervisorId, managerId, workingDays, ...rest } = dto;
    const targetRole = role ?? Role.AGENT;

    if (targetRole === Role.AGENT && (!supervisorId || !managerId)) {
      throw new BadRequestException('Agents require both a supervisor and a manager');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uniqueReferralCode = await this.generateUniqueReferralCode();

    const hierarchyIds = [supervisorId, managerId].filter((id): id is string => Boolean(id));
    const hierarchyUsers = hierarchyIds.length > 0
      ? await this.prisma.user.findMany({ where: { id: { in: hierarchyIds } }, select: { id: true, role: true } })
      : [];
    if (hierarchyUsers.length !== new Set(hierarchyIds).size) {
      throw new NotFoundException('Supervisor or manager not found');
    }
    if (supervisorId && hierarchyUsers.find((user) => user.id === supervisorId)?.role !== Role.SUPERVISOR) {
      throw new BadRequestException('Selected supervisor must have the SUPERVISOR role');
    }
    const managerRole = managerId ? hierarchyUsers.find((user) => user.id === managerId)?.role : undefined;
    if (managerId && managerRole !== Role.MANAGER && managerRole !== Role.SUPERVISOR) {
      throw new BadRequestException('Selected manager must have the MANAGER or SUPERVISOR role');
    }

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        email,
        phone,
        password: hashedPassword,
        referralCode: uniqueReferralCode,
        role: targetRole,
        tier: Tier.BRONZE,
        dailyLeadTarget: dailyLeadTarget ?? 0,
        monthlyConversionTarget: monthlyConversionTarget ?? 0,
        supervisorId,
        managerId,
        workingDays: workingDays ?? [],
      },
    });

    const { password: _pw, ...result } = user;
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string): Promise<Omit<User, "password"> | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const { password: _password, ...result } = user;
    return result;
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<Omit<User, 'password'>> {
    const { kycDocumentUrl, password, dailyLeadTarget, monthlyConversionTarget, ...rest } = dto;
    const data: Prisma.UserUpdateInput = { ...rest };

    if (dailyLeadTarget !== undefined) data.dailyLeadTarget = dailyLeadTarget;
    if (monthlyConversionTarget !== undefined) data.monthlyConversionTarget = monthlyConversionTarget;
    
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    // Auto-calculate tier based on current referral count
    data.tier = this.calculateTier(currentUser.referralCount);

    if (dto.phone) {
      const existing = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            { phone: dto.phone },
          ],
        },
      });

      if (existing) {
        throw new ConflictException("Phone already in use");
      }
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    if (kycDocumentUrl) {
      data.kycDocuments = { url: kycDocumentUrl };
      data.kycStatus = KycStatus.PENDING;
    }

    // Handle Paystack Recipient Creation
    const bankName = dto.bankName || currentUser.bankName;
    const accountNumber = dto.accountNumber || currentUser.accountNumber;
    const accountName = dto.accountName || currentUser.accountName || currentUser.fullName;

    if (bankName && accountNumber && (dto.bankName || dto.accountNumber)) {
      try {
        const bankCode = await this.getBankCode(bankName);
        if (bankCode) {
          const recipient = await this.paystackService.createTransferRecipient({
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
          });

          if (recipient && recipient.recipient_code) {
            data.paystackRecipientCode = recipient.recipient_code;
          }
        }
      } catch (error) {
        this.logger.error(`Failed to create Paystack recipient: ${error.message}`);
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    const { password: _password, ...result } = user;
    return result;
  }

  async requestEmailUpdate(userId: string, newEmail: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) throw new ConflictException('Email already in use');

    const code = this.otpService.generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        newEmail,
        emailVerificationCode: code,
        emailVerificationExpiry: expiry,
      },
    });

    const sent = await this.resendService.sendOtpEmail(newEmail, code);
    if (!sent) throw new BadRequestException('Failed to send verification email');

    return { message: 'Verification code sent to your new email' };
  }

  async verifyEmailUpdate(userId: string, code: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.emailVerificationCode || !user.newEmail) {
      throw new BadRequestException('No email update request found');
    }

    if (user.emailVerificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (this.otpService.isExpired(user.emailVerificationExpiry!)) {
      throw new BadRequestException('Verification code has expired');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: user.newEmail,
        newEmail: null,
        emailVerificationCode: null,
        emailVerificationExpiry: null,
      },
    });

    const { password: _password, ...result } = updatedUser;
    return result;
  }

  private calculateTier(referralCount: number): Tier {
    if (referralCount >= 51) return Tier.GOLD;
    if (referralCount >= 11) return Tier.SILVER;
    return Tier.BRONZE;
  }

  private async getBankCode(bankName: string): Promise<string | null> {
    try {
      const banks = await this.paystackService.listBanks();
      if (!banks) return null;

      const normalizedSearch = bankName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const bank = banks.find((b: any) => {
        const normalizedBankName = b.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        return normalizedBankName.includes(normalizedSearch) || normalizedSearch.includes(normalizedBankName);
      });

      return bank ? bank.code : null;
    } catch (error) {
      this.logger.error(`Error fetching bank codes: ${error.message}`);
      return null;
    }
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async findAllAdmin(filter: UserFilterDto) {
    const where: Prisma.UserWhereInput = {};

    if (filter.role) {
      where.role = filter.role;
    } else {
      // Default to showing affiliates unless a role filter is explicitly set
      where.role = Role.AFFILIATE;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.isManager !== undefined) {
      where.isManagerMode = filter.isManager;
    }

    if (filter.search) {
      where.OR = [
        { fullName: { contains: filter.search, mode: "insensitive" } },
        { email: { contains: filter.search, mode: "insensitive" } },
        { phone: { contains: filter.search, mode: "insensitive" } },
        { referralCode: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: filter.skip,
        take: filter.take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          role: true,
          status: true,
          kycStatus: true,
          tier: true,
          referralCode: true,
          createdAt: true,
          totalEarnings: true,
          isManagerMode: true,
          referralCount: true,
          _count: {
            select: { referrals: true, businesses: true, leads: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
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
          select: { referrals: true, businesses: true, leads: true },
        },
      },
    });
    if (!user) return null;
    const { password: _password, ...result } = user;
    return result;
  }

  async updateStatus(id: string, data: { status: UserStatus }) {
    return this.prisma.user.update({
      where: { id },
      data: { status: data.status },
    });
  }

  async updateKyc(id: string, data: { status: KycStatus }) {
    return this.prisma.user.update({
      where: { id },
      data: { kycStatus: data.status },
    });
  }

  async updateRole(id: string, role: Role) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async updateManagerMode(id: string, isManagerMode: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    return this.prisma.user.update({
      where: { id },
      data: {
        isManagerMode,
        managerQualificationExpiry: isManagerMode 
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
          : null,
      },
    });
  }

  async getLeaderboard(limit: number = 10) {
    return this.prisma.user.findMany({
      where: { role: "AFFILIATE", status: "ACTIVE" },
      orderBy: { totalEarnings: "desc" },
      take: limit,
      select: {
        id: true,
        fullName: true,
        totalEarnings: true,
        _count: {
          select: { referrals: true },
        },
      },
    });
  }

  async exportUsersCsv(): Promise<string> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        kycStatus: true,
        tier: true,
        totalEarnings: true,
        createdAt: true,
      },
    });

    const header = [
      "ID",
      "Email",
      "Full Name",
      "Phone",
      "Role",
      "Status",
      "KYC Status",
      "Tier",
      "Total Earnings",
      "Created At",
    ];
    const rows = users.map((u) =>
      [
        u.id,
        u.email,
        u.fullName,
        u.phone,
        u.role,
        u.status,
        u.kycStatus,
        u.tier,
        u.totalEarnings.toString(),
        u.createdAt.toISOString(),
      ]
        .map((val) => `"${val}"`)
        .join(","),
    );

    return [header.join(","), ...rows].join("\n");
  }

  async signAgreement(userId: string): Promise<Omit<User, "password">> {
    const settings = await this.prisma.platformSettings.findFirst();
    if (!settings) throw new NotFoundException("Platform settings not found");

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        signedAgreementVersion: settings.agreementVersion,
        signedAt: new Date(),
      },
    });

    const { password: _password, ...result } = user;
    return result;
  }

  async getAgreementStatus(userId: string): Promise<{ isUpToDate: boolean; signedVersion: number | null; latestVersion: number }> {
    const [user, settings] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { signedAgreementVersion: true } }),
      this.prisma.platformSettings.findFirst({ select: { agreementVersion: true } }),
    ]);

    if (!user) throw new NotFoundException("User not found");
    if (!settings) throw new NotFoundException("Platform settings not found");

    return {
      isUpToDate: user.signedAgreementVersion === settings.agreementVersion,
      signedVersion: user.signedAgreementVersion,
      latestVersion: settings.agreementVersion,
    };
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

  // --- ADMIN AFFILIATE / USER EXTENSIONS ---
  async getUserLocations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, territoryId: true, marketMappingAssignments: { include: { cluster: true } } },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateUserLocations(userId: string, territoryId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    return this.prisma.user.update({
      where: { id: userId },
      data: { territoryId },
    });
  }

  async sendEmailToUser(userId: string, subject: string, message: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    await this.resendService.sendBroadcastEmail([user.email], subject || "Notification from Vemtap Admin", message);

    await this.prisma.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        title: subject || "Admin Message",
        message,
      },
    });

    return { success: true, message: "Email sent successfully" };
  }


  async getUserPerformanceReport(userId: string, period: string = "monthly") {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const [leads, businesses, commissions] = await Promise.all([
      this.prisma.lead.findMany({ where: { affiliateId: userId } }),
      this.prisma.business.findMany({ where: { affiliateId: userId } }),
      this.prisma.commission.findMany({ where: { userId } }),
    ]);

    return {
      userId,
      period,
      totalLeads: leads.length,
      totalConversions: businesses.length,
      totalEarnings: Number(user.totalEarnings || 0),
      dailyTarget: user.dailyLeadTarget,
      monthlyTarget: user.monthlyConversionTarget,
      reportingScore: Number(user.reportingScore ?? 0),
      attendanceRate: Number(user.attendanceRate ?? 0),
      leads: leads.slice(0, 10),
      businesses: businesses.slice(0, 10),
      commissions: commissions.slice(0, 10),
    };
  }

  async getUserActivityHistory(userId: string) {
    const [activities, targetLogs, agreementSignatures] = await Promise.all([
      this.prisma.activity.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.prisma.targetAdjustmentHistory.findMany({ where: { memberId: userId }, orderBy: { createdAt: "desc" } }),
      this.prisma.agreementSignature.findMany({ where: { userId }, include: { agreement: true } }),
    ]);

    return {
      userId,
      activities,
      targetAdjustmentLogs: targetLogs,
      signatures: agreementSignatures,
    };
  }

  async getUserTeamMembers(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const downline = await this.prisma.user.findMany({
      where: { referrerId: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        dailyLeadTarget: true,
        monthlyConversionTarget: true,
        createdAt: true,
      },
    });

    return {
      managerId: userId,
      teamMembers: downline,
    };
  }

  async updateUserTargets(userId: string, managerId: string, dailyTarget: number, monthlyTarget: number, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const oldDaily = user.dailyLeadTarget;
    const oldMonthly = user.monthlyConversionTarget;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        dailyLeadTarget: dailyTarget,
        monthlyConversionTarget: monthlyTarget,
      },
    });

    await this.prisma.targetAdjustmentHistory.create({
      data: {
        managerId,
        memberId: userId,
        oldDailyLeadTarget: oldDaily,
        newDailyLeadTarget: dailyTarget,
        oldMonthlyConversionTarget: oldMonthly,
        newMonthlyConversionTarget: monthlyTarget,
        reason: reason || "Admin update",
      },
    });

    const { password: _, ...safe } = updatedUser;
    return safe;
  }

  async assignUserManager(userId: string, managerId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const manager = await this.prisma.user.findUnique({ where: { id: managerId } });
    if (!manager) throw new NotFoundException("Manager not found");

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { referrerId: managerId },
    });

    const { password: _, ...safe } = updatedUser;
    return safe;
  }
}

