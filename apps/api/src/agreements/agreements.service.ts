import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Agreement, AgreementSignature } from '@prisma/client';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';
import { SignAgreementDto } from './dto/sign-agreement.dto';

const ACTIVE_CACHE_PREFIX = 'agreements:active:role:';
const SIGNED_CACHE_PREFIX = 'agreements:signed:user:';
const CACHE_TTL = 3600 * 1000; // 1 hour in ms

@Injectable()
export class AgreementsService {
  private readonly logger = new Logger(AgreementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Helper to build role-specific cache keys
   */
  private getActiveCacheKey(role: Role): string {
    return `${ACTIVE_CACHE_PREFIX}${role}`;
  }

  /**
   * Helper to build user signature cache keys
   */
  private getSignedCacheKey(userId: string): string {
    return `${SIGNED_CACHE_PREFIX}${userId}`;
  }

  /**
   * Invalidate active agreements cache for targeted roles
   */
  private async invalidateActiveCaches(roles: Role[]): Promise<void> {
    for (const role of roles) {
      const key = this.getActiveCacheKey(role);
      await this.cacheManager.del(key);
    }
  }

  /**
   * Invalidate user signature cache
   */
  private async invalidateUserSignedCache(userId: string): Promise<void> {
    const key = this.getSignedCacheKey(userId);
    await this.cacheManager.del(key);
  }

  /**
   * Create a new agreement and notify target users
   */
  async create(dto: CreateAgreementDto): Promise<Agreement> {
    const agreement = await this.prisma.agreement.create({
      data: {
        title: dto.title,
        description: dto.description,
        content: dto.content,
        targetRoles: dto.targetRoles,
        version: 1,
        isActive: true,
      },
    });

    // Invalidate active caches for target roles
    await this.invalidateActiveCaches(dto.targetRoles);

    // Notify targeted users in-app (asynchronous to prevent blocking response)
    this.notifyTargetedUsers(agreement.id, dto.title, dto.targetRoles).catch((err) => {
      this.logger.error(`Failed to send notifications for agreement ${agreement.id}`, err.stack);
    });

    return agreement;
  }

  /**
   * Send in-app notification to all active users in target roles
   */
  private async notifyTargetedUsers(agreementId: string, title: string, targetRoles: Role[]): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: targetRoles },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (users.length === 0) return;

    const notifications = users.map((user) => ({
      userId: user.id,
      type: 'SYSTEM' as const,
      title: `Agreement Required: ${title}`,
      message: `A new agreement has been posted. Please review and sign it.`,
      data: { agreementId, type: 'AGREEMENT_REQUIRED' },
    }));

    // prisma createMany is highly performant
    await this.prisma.notification.createMany({
      data: notifications,
    });

    this.logger.log(`Created ${notifications.length} notifications for new agreement: ${title}`);
  }

  /**
   * Update an agreement (increments version if title, description, content or targetRoles change)
   */
  async update(id: string, dto: UpdateAgreementDto): Promise<Agreement> {
    const existing = await this.prisma.agreement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Agreement with ID ${id} not found`);
    }

    const isVersionChange =
      (dto.title !== undefined && dto.title !== existing.title) ||
      (dto.description !== undefined && dto.description !== existing.description) ||
      (dto.content !== undefined && dto.content !== existing.content) ||
      (dto.targetRoles !== undefined && JSON.stringify(dto.targetRoles) !== JSON.stringify(existing.targetRoles));

    const updatedVersion = isVersionChange ? existing.version + 1 : existing.version;

    const updated = await this.prisma.agreement.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        description: dto.description ?? existing.description,
        content: dto.content ?? existing.content,
        targetRoles: dto.targetRoles ?? existing.targetRoles,
        isActive: dto.isActive ?? existing.isActive,
        version: updatedVersion,
      },
    });

    // Invalidate caches
    const allRoles = Array.from(new Set([...existing.targetRoles, ...(dto.targetRoles ?? [])]));
    await this.invalidateActiveCaches(allRoles);

    // If version changed, notify users they need to sign the updated agreement
    if (isVersionChange && updated.isActive) {
      this.notifyTargetedUsers(updated.id, updated.title, updated.targetRoles).catch((err) => {
        this.logger.error(`Failed to send update notifications for agreement ${updated.id}`, err.stack);
      });
    }

    return updated;
  }

  /**
   * Fetch all agreements, optional role and active filters
   */
  async findAll(role?: Role, isActive?: boolean): Promise<Agreement[]> {
    const where: any = {};
    if (role) {
      where.targetRoles = { has: role };
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.agreement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single agreement by ID
   */
  async findOne(id: string): Promise<Agreement> {
    const agreement = await this.prisma.agreement.findUnique({ where: { id } });
    if (!agreement) {
      throw new NotFoundException(`Agreement with ID ${id} not found`);
    }
    return agreement;
  }

  /**
   * Get pending agreements for a given user (utilizes Redis caching layer for active agreements)
   */
  async getPendingAgreements(userId: string, role: Role): Promise<Agreement[]> {
    // 1. Fetch active agreements targeting this role from cache or DB
    const activeCacheKey = this.getActiveCacheKey(role);
    let activeAgreements = await this.cacheManager.get<Agreement[]>(activeCacheKey);

    if (!activeAgreements) {
      activeAgreements = await this.prisma.agreement.findMany({
        where: {
          targetRoles: { has: role },
          isActive: true,
        },
      });
      await this.cacheManager.set(activeCacheKey, activeAgreements, CACHE_TTL);
    }

    if (activeAgreements.length === 0) return [];

    // 2. Fetch user's signed agreements directly from DB for 100% real-time accuracy
    const signedLogs = await this.prisma.agreementSignature.findMany({
      where: { userId },
      select: { agreementId: true, version: true },
    });

    // Map user signatures for O(1) lookup
    const signedMap = new Map<string, number>();
    for (const log of signedLogs) {
      const currentVal = signedMap.get(log.agreementId) ?? 0;
      if (log.version > currentVal) {
        signedMap.set(log.agreementId, log.version);
      }
    }

    // 3. Filter agreements where user signature is missing or outdated
    return activeAgreements.filter((agreement) => {
      const signedVersion = signedMap.get(agreement.id);
      return signedVersion === undefined || signedVersion < agreement.version;
    });
  }

  /**
   * Sign an agreement (version must match the latest version)
   */
  async signAgreement(userId: string, agreementId: string, dto: SignAgreementDto): Promise<AgreementSignature> {
    const agreement = await this.prisma.agreement.findUnique({ where: { id: agreementId } });
    if (!agreement) {
      throw new NotFoundException(`Agreement with ID ${agreementId} not found`);
    }

    if (!agreement.isActive) {
      throw new BadRequestException('Cannot sign an inactive agreement');
    }

    if (dto.version !== agreement.version) {
      throw new BadRequestException(
        `Agreement version mismatch. Attempted to sign version ${dto.version}, but latest is ${agreement.version}. Please reload and sign the latest terms.`,
      );
    }

    const existing = await this.prisma.agreementSignature.findUnique({
      where: {
        userId_agreementId_version: {
          userId,
          agreementId,
          version: dto.version,
        },
      },
    });

    if (existing) {
      await this.invalidateUserSignedCache(userId);
      return existing; // Already signed this version
    }

    const signature = await this.prisma.agreementSignature.create({
      data: {
        userId,
        agreementId,
        version: dto.version,
      },
    });

    // Invalidate user's signature cache so next pending check is fresh
    await this.invalidateUserSignedCache(userId);

    return signature;
  }

  /**
   * Get all agreements signed by the current user (historical list)
   */
  async getUserSignatures(userId: string): Promise<any[]> {
    return this.prisma.agreementSignature.findMany({
      where: { userId },
      include: {
        agreement: {
          select: {
            title: true,
            description: true,
            version: true,
          },
        },
      },
      orderBy: { signedAt: 'desc' },
    });
  }

  /**
   * Admin: Get signature statistics and lists of users who signed or are pending for a specific agreement
   */
  async getAgreementSignaturesAudit(id: string): Promise<any> {
    const agreement = await this.prisma.agreement.findUnique({ where: { id } });
    if (!agreement) {
      throw new NotFoundException(`Agreement with ID ${id} not found`);
    }

    // Find all users targetable by this agreement
    const targetUsers = await this.prisma.user.findMany({
      where: {
        role: { in: agreement.targetRoles },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    // Find all signatures for this agreement
    const signatures = await this.prisma.agreementSignature.findMany({
      where: { agreementId: id },
      select: {
        userId: true,
        version: true,
        signedAt: true,
      },
    });

    // Map signatures by user ID (keep the latest version signed)
    const signatureMap = new Map<string, { version: number; signedAt: Date }>();
    for (const sig of signatures) {
      const existingSig = signatureMap.get(sig.userId);
      if (!existingSig || sig.version > existingSig.version) {
        signatureMap.set(sig.userId, { version: sig.version, signedAt: sig.signedAt });
      }
    }

    // Combine
    const auditList = targetUsers.map((user) => {
      const sig = signatureMap.get(user.id);
      const isSigned = !!sig;
      const isUpToDate = isSigned && sig.version === agreement.version;

      return {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        signed: isSigned,
        signedVersion: sig ? sig.version : null,
        signedAt: sig ? sig.signedAt : null,
        isUpToDate,
      };
    });

    const totalTargeted = targetUsers.length;
    const totalSigned = auditList.filter((x) => x.isUpToDate).length;
    const totalPending = totalTargeted - totalSigned;

    return {
      agreementId: id,
      title: agreement.title,
      description: agreement.description,
      version: agreement.version,
      isActive: agreement.isActive,
      createdAt: agreement.createdAt,
      stats: {
        totalTargeted,
        totalSigned,
        totalPending,
        signedPercentage: totalTargeted > 0 ? Math.round((totalSigned / totalTargeted) * 100) : 100,
      },
      signatures: auditList,
    };
  }

  /**
   * Admin: Get all agreements applicable to a user's role and their signature status for a user
   */
  async getUserAgreementsAudit(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Fetch all active agreements targeting the user's role
    const agreements = await this.prisma.agreement.findMany({
      where: {
        targetRoles: { has: user.role },
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all signatures from this user
    const signatures = await this.prisma.agreementSignature.findMany({
      where: { userId },
      select: {
        agreementId: true,
        version: true,
        signedAt: true,
      },
    });

    const signatureMap = new Map<string, typeof signatures[0]>();
    for (const sig of signatures) {
      const existing = signatureMap.get(sig.agreementId);
      if (!existing || sig.version > existing.version) {
        signatureMap.set(sig.agreementId, sig);
      }
    }

    const auditList = agreements.map((agreement) => {
      const sig = signatureMap.get(agreement.id);
      const isSigned = !!sig;
      const isUpToDate = isSigned && sig.version === agreement.version;

      return {
        agreementId: agreement.id,
        title: agreement.title,
        description: agreement.description,
        latestVersion: agreement.version,
        signed: isSigned,
        signedVersion: sig ? sig.version : null,
        signedAt: sig ? sig.signedAt : null,
        isUpToDate,
      };
    });

    return {
      userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      agreements: auditList,
    };
  }
}
