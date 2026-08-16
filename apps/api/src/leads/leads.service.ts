import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto, HarvestLeadsFilterDto, DuplicateLeadsFilterDto } from './dto/leads.dto';
import { isVisitedLeadStatus, normalizeLeadStatus } from '../common/lead.constants';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any, filters: LeadFilterDto) {
    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const where: any = {
      deletedAt: null,
      isPlaceholder: false,
      ...(isPrivileged ? {} : { userId: user.id }),
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.visited === true) {
      where.visitedAt = { not: null };
    } else if (filters.visited === false) {
      where.visitedAt = null;
    }

    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { contactName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        take: filters.take,
        skip: filters.skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              referralCode: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: data.map((lead) => ({ ...lead, visited: lead.visitedAt != null })),
      meta: {
        total,
        page: filters.page,
        limit: filters.limit || 10,
        totalPages: Math.ceil(total / (filters.limit || 10)),
      },
    };
  }

  async findHarvest(filters: HarvestLeadsFilterDto) {
    const where = this.buildHarvestWhereClause(filters);
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const [data, total, totalWithPhone, convertedCount, activePipelineCount, statusGroups] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        take: filters.take,
        skip: filters.skip,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              referralCode: true,
              avatar: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({
        where: {
          ...where,
          phone: { not: null },
          NOT: { phone: '' },
        },
      }),
      this.prisma.lead.count({
        where: {
          ...where,
          status: { in: ['CONVERTED', 'CUSTOMER'] },
        },
      }),
      this.prisma.lead.count({
        where: {
          ...where,
          status: { in: ['NOT_YET', 'VISITED', 'CONTACTED', 'INTERESTED', 'DEMO_SCHEDULED', 'DEMO_DONE'] },
        },
      }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where: {
          deletedAt: null,
          isPlaceholder: false,
        },
        _count: { id: true },
      }),
    ]);

    return {
      data: data.map((lead) => ({ ...lead, visited: lead.visitedAt != null })),
      meta: {
        total,
        page: filters.page,
        limit: filters.limit || 10,
        totalPages: Math.ceil(total / (filters.limit || 10)),
      },
      stats: {
        totalHarvested: total,
        totalWithPhone,
        totalConverted: convertedCount,
        totalPipeline: activePipelineCount,
        statusBreakdown: statusGroups.reduce(
          (acc, curr) => ({ ...acc, [curr.status]: curr._count.id }),
          {} as Record<string, number>,
        ),
      },
    };
  }

  private buildHarvestWhereClause(filters: HarvestLeadsFilterDto): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
      isPlaceholder: false,
    };

    if (filters.role) {
      where.user = {
        role: filters.role as any,
      };
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = {
        equals: filters.status,
        mode: 'insensitive',
      };
    }

    if (filters.location) {
      where.OR = [
        { location: { contains: filters.location, mode: 'insensitive' } },
        { businessAddress: { contains: filters.location, mode: 'insensitive' } },
        { gpsAddress: { contains: filters.location, mode: 'insensitive' } },
      ];
    }

    if (filters.hasPhone) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        { phone: { not: null } },
        { phone: { not: '' } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lte: new Date(filters.endDate) }),
      };
    }

    if (filters.search) {
      const q = filters.search.trim();
      const searchConditions: Prisma.LeadWhereInput[] = [
        { businessName: { contains: q, mode: 'insensitive' } },
        { contactName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { businessAddress: { contains: q, mode: 'insensitive' } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q } } },
      ];

      if (where.OR) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          { OR: searchConditions },
        ];
      } else {
        where.OR = searchConditions;
      }
    }

    return where;
  }

  async exportHarvest(filters: HarvestLeadsFilterDto): Promise<string> {
    const where = this.buildHarvestWhereClause(filters);
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const leads = await this.prisma.lead.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: 10000,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            role: true,
            referralCode: true,
          },
        },
      },
    });

    const headers = [
      'Business Name',
      'Contact Name',
      'Contact Role',
      'Phone Number',
      'Email',
      'Location',
      'Business Address',
      'Industry',
      'Pipeline Status',
      'Source',
      'Added By Name',
      'Added By Role',
      'Added By Phone',
      'Added By Email',
      'Referral Code',
      'Date Added',
    ].join(',');

    const escapeCsv = (str?: string | null) => {
      if (!str) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const rows = leads.map((lead) =>
      [
        escapeCsv(lead.businessName),
        escapeCsv(lead.contactName),
        escapeCsv(lead.contactRole),
        escapeCsv(lead.phone),
        escapeCsv(lead.email),
        escapeCsv(lead.location),
        escapeCsv(lead.businessAddress),
        escapeCsv(lead.industry),
        escapeCsv(lead.status),
        escapeCsv(lead.source),
        escapeCsv(lead.user?.fullName),
        escapeCsv(lead.user?.role),
        escapeCsv(lead.user?.phone),
        escapeCsv(lead.user?.email),
        escapeCsv(lead.user?.referralCode),
        escapeCsv(lead.createdAt.toISOString()),
      ].join(','),
    );

    return [headers, ...rows].join('\n');
  }

  async findOne(id: string, user: any) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead || lead.deletedAt || lead.isPlaceholder) {
      throw new NotFoundException('Lead not found');
    }

    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isPrivileged && lead.userId !== user.id) {
      throw new ForbiddenException('You do not have access to this lead');
    }

    return { ...lead, visited: lead.visitedAt != null };
  }

  async create(userId: string, dto: CreateLeadDto) {
    const status = normalizeLeadStatus(dto.status);
    const now = new Date();

    const lead = await this.prisma.lead.create({
      data: {
        businessName: dto.businessName,
        industry: dto.industry || '',
        businessAddress: dto.businessAddress || null,
        location: dto.location || null,
        phone: dto.phone || null,
        email: dto.email || null,
        contactName: dto.contactName || null,
        contactRole: dto.contactRole || null,
        source: dto.source || 'Market Mapping',
        status,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        comments: dto.comments || null,
        priority: dto.priority || 'MEDIUM',
        assignedAgentId: dto.assignedAgentId || null,
        gpsLat: dto.gpsLat || null,
        gpsLng: dto.gpsLng || null,
        gpsAddress: dto.gpsAddress || null,
        userId,
        visitedAt: isVisitedLeadStatus(status) ? now : null,
      },
    });

    return { ...lead, visited: lead.visitedAt != null };
  }

  async update(id: string, user: any, dto: UpdateLeadDto) {
    const lead = await this.findOne(id, user);

    const status = normalizeLeadStatus(dto.status ?? lead.status);

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.businessName !== undefined ? { businessName: dto.businessName } : {}),
        ...(dto.industry !== undefined ? { industry: dto.industry } : {}),
        ...(dto.businessAddress !== undefined ? { businessAddress: dto.businessAddress } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.contactName !== undefined ? { contactName: dto.contactName } : {}),
        ...(dto.contactRole !== undefined ? { contactRole: dto.contactRole } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.comments !== undefined ? { comments: dto.comments } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.gpsLat !== undefined ? { gpsLat: dto.gpsLat } : {}),
        ...(dto.gpsLng !== undefined ? { gpsLng: dto.gpsLng } : {}),
        ...(dto.gpsAddress !== undefined ? { gpsAddress: dto.gpsAddress } : {}),
        ...(dto.assignedAgentId !== undefined ? { assignedAgentId: dto.assignedAgentId } : {}),
        status,
        visitedAt: isVisitedLeadStatus(status) && !lead.visitedAt
          ? new Date()
          : lead.visitedAt,
        followUpDate:
          dto.followUpDate !== undefined
            ? dto.followUpDate
              ? new Date(dto.followUpDate)
              : null
            : lead.followUpDate,
      },
    });

    return { ...updated, visited: updated.visitedAt != null };
  }

  async remove(id: string, user: any) {
    await this.findOne(id, user);
    return this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats(user: any) {
    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const where: any = {
      deletedAt: null,
      isPlaceholder: false,
      ...(isPrivileged ? {} : { userId: user.id }),
    };

    const [total, visited, notVisited, byStatus] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, visitedAt: { not: null } } }),
      this.prisma.lead.count({ where: { ...where, visitedAt: null } }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    return {
      total,
      visited,
      notVisited,
      byStatus: byStatus.reduce(
        (acc, row) => ({ ...acc, [row.status]: row._count.status }),
        {} as Record<string, number>,
      ),
    };
  }

  async findDuplicates(filters: DuplicateLeadsFilterDto) {
    const threshold = filters.threshold ?? 70;
    const limit = filters.limit ?? 100;
    const search = filters.search?.trim().toLowerCase();

    // Fetch all active leads with creator metadata
    const leads = await this.prisma.lead.findMany({
      where: {
        deletedAt: null,
        isPlaceholder: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            referralCode: true,
            avatar: true,
            status: true,
          },
        },
      },
    });

    if (!leads || leads.length === 0) {
      return {
        clusters: [],
        stats: {
          totalClusters: 0,
          totalDuplicateLeads: 0,
          highConfidenceClusters: 0,
          threshold,
        },
      };
    }

    // Fast candidate indexing
    const phoneBuckets = new Map<string, number[]>();
    const emailBuckets = new Map<string, number[]>();
    const tokenBuckets = new Map<string, number[]>();

    leads.forEach((lead, idx) => {
      const p = cleanPhone(lead.phone);
      if (p && p.length >= 7) {
        if (!phoneBuckets.has(p)) phoneBuckets.set(p, []);
        phoneBuckets.get(p)!.push(idx);
      }

      const e = lead.email?.trim().toLowerCase();
      if (e) {
        if (!emailBuckets.has(e)) emailBuckets.set(e, []);
        emailBuckets.get(e)!.push(idx);
      }

      const tokens = cleanBusinessName(lead.businessName || '')
        .split(/\s+/)
        .filter((t) => t.length >= 3);

      tokens.forEach((token) => {
        if (!tokenBuckets.has(token)) tokenBuckets.set(token, []);
        tokenBuckets.get(token)!.push(idx);
      });
    });

    const candidatePairs = new Set<string>();
    const addPair = (i: number, j: number) => {
      if (i === j) return;
      const min = Math.min(i, j);
      const max = Math.max(i, j);
      candidatePairs.add(`${min}:${max}`);
    };

    phoneBuckets.forEach((indices) => {
      for (let i = 0; i < indices.length; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          addPair(indices[i], indices[j]);
        }
      }
    });

    emailBuckets.forEach((indices) => {
      for (let i = 0; i < indices.length; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          addPair(indices[i], indices[j]);
        }
      }
    });

    tokenBuckets.forEach((indices) => {
      if (indices.length <= 150) {
        for (let i = 0; i < indices.length; i++) {
          for (let j = i + 1; j < indices.length; j++) {
            addPair(indices[i], indices[j]);
          }
        }
      }
    });

    // If total leads is small (<= 400), do exhaustive pairing to ensure nothing is missed
    if (leads.length <= 400) {
      for (let i = 0; i < leads.length; i++) {
        for (let j = i + 1; j < leads.length; j++) {
          addPair(i, j);
        }
      }
    }

    // Build Adjacency Graph for pairs >= threshold
    const adj = new Map<number, Array<{ target: number; score: number; reasons: string[] }>>();
    const pairScores = new Map<string, PairSimilarityResult>();

    candidatePairs.forEach((pairKey) => {
      const [iStr, jStr] = pairKey.split(':');
      const i = parseInt(iStr, 10);
      const j = parseInt(jStr, 10);
      const res = computeLeadSimilarity(leads[i], leads[j]);
      pairScores.set(pairKey, res);

      if (res.score >= threshold) {
        if (!adj.has(i)) adj.set(i, []);
        if (!adj.has(j)) adj.set(j, []);
        adj.get(i)!.push({ target: j, score: res.score, reasons: res.reasons });
        adj.get(j)!.push({ target: i, score: res.score, reasons: res.reasons });
      }
    });

    // Connected Components (BFS)
    const visited = new Set<number>();
    const clusters: any[] = [];

    for (let i = 0; i < leads.length; i++) {
      if (visited.has(i) || !adj.has(i)) continue;

      const componentIndices: number[] = [];
      const queue: number[] = [i];
      visited.add(i);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        componentIndices.push(curr);

        const neighbors = adj.get(curr) || [];
        for (const n of neighbors) {
          if (!visited.has(n.target)) {
            visited.add(n.target);
            queue.push(n.target);
          }
        }
      }

      if (componentIndices.length >= 2) {
        const clusterLeads = componentIndices.map((idx) => leads[idx]);

        // Filter by search query if present
        if (search) {
          const matchSearch = clusterLeads.some(
            (l) =>
              l.businessName?.toLowerCase().includes(search) ||
              l.phone?.toLowerCase().includes(search) ||
              l.email?.toLowerCase().includes(search) ||
              l.contactName?.toLowerCase().includes(search) ||
              l.user?.fullName?.toLowerCase().includes(search),
          );
          if (!matchSearch) continue;
        }

        // Identify primary lead: converted/customer lead first, or oldest created lead
        const sortedByStatusAndDate = [...clusterLeads].sort((a, b) => {
          const isAConverted = a.status === 'CONVERTED' || a.status === 'CUSTOMER' ? 1 : 0;
          const isBConverted = b.status === 'CONVERTED' || b.status === 'CUSTOMER' ? 1 : 0;
          if (isAConverted !== isBConverted) return isBConverted - isAConverted;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        const primaryLead = sortedByStatusAndDate[0];
        const primaryIdx = leads.findIndex((l) => l.id === primaryLead.id);

        let maxClusterScore = 0;
        const clusterReasonsSet = new Set<string>();

        const formattedLeads = clusterLeads.map((lead) => {
          const isPrimary = lead.id === primaryLead.id;
          let simScore = 100;
          let itemReasons: string[] = ['Cluster Primary Reference'];

          if (!isPrimary) {
            const leadIdx = leads.findIndex((l) => l.id === lead.id);
            const pairKey = `${Math.min(primaryIdx, leadIdx)}:${Math.max(primaryIdx, leadIdx)}`;
            const directToPrimary = pairScores.get(pairKey);

            if (directToPrimary && directToPrimary.score >= threshold) {
              simScore = directToPrimary.score;
              itemReasons = directToPrimary.reasons;
            } else {
              // Find max similarity against any mate in this component
              let bestScore = 0;
              let bestReasons: string[] = [];
              componentIndices.forEach((otherIdx) => {
                if (otherIdx !== leadIdx) {
                  const pKey = `${Math.min(otherIdx, leadIdx)}:${Math.max(otherIdx, leadIdx)}`;
                  const pRes = pairScores.get(pKey);
                  if (pRes && pRes.score > bestScore) {
                    bestScore = pRes.score;
                    bestReasons = pRes.reasons;
                  }
                }
              });
              simScore = bestScore || threshold;
              itemReasons = bestReasons.length ? bestReasons : ['High Cluster Similarity'];
            }
          }

          if (!isPrimary && simScore > maxClusterScore) {
            maxClusterScore = simScore;
          }
          itemReasons.forEach((r) => clusterReasonsSet.add(r));

          return {
            ...lead,
            visited: lead.visitedAt != null,
            similarityPercentage: simScore,
            isPrimary,
            reasons: itemReasons,
          };
        });

        // Sort cluster leads: primary first, then descending similarity percentage
        formattedLeads.sort((a, b) => {
          if (a.isPrimary) return -1;
          if (b.isPrimary) return 1;
          return b.similarityPercentage - a.similarityPercentage;
        });

        clusters.push({
          clusterId: `cluster_${primaryLead.id}`,
          primaryLeadId: primaryLead.id,
          primaryBusinessName: primaryLead.businessName,
          leadCount: formattedLeads.length,
          maxSimilarity: maxClusterScore || 100,
          matchReasons: Array.from(clusterReasonsSet),
          leads: formattedLeads,
        });
      }
    }

    // Sort clusters: high similarity first, then larger group size
    clusters.sort((a, b) => {
      if (b.maxSimilarity !== a.maxSimilarity) {
        return b.maxSimilarity - a.maxSimilarity;
      }
      return b.leadCount - a.leadCount;
    });

    const paginatedClusters = clusters.slice(0, limit);
    const totalDuplicateLeads = clusters.reduce((acc, c) => acc + c.leadCount, 0);
    const highConfidenceClusters = clusters.filter((c) => c.maxSimilarity >= 90).length;

    return {
      clusters: paginatedClusters,
      stats: {
        totalClusters: clusters.length,
        totalDuplicateLeads,
        highConfidenceClusters,
        threshold,
      },
    };
  }
}

// ------------------------------------------------------------
// Helper Utilities for Duplicate String Similarity & Metrics
// ------------------------------------------------------------

interface PairSimilarityResult {
  score: number; // 0 to 100
  reasons: string[];
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1,     // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function stringSimilarityRatio(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  if (s1 === s2) return 1;
  if (!s1.length || !s2.length) return 0;
  const maxLen = Math.max(s1.length, s2.length);
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

function tokenDiceSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  return (2 * intersection) / (setA.size + setB.size);
}

function cleanBusinessName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(ltd|limited|enterprise|enterprises|ent|nig|nigeria|plc|ventures|venture|stores|store|supermarket|mart|shop|plaza|concept|concepts|services|service|intl|international|hub|co|company|corp|kitchen|restaurant|bar|cafe|hotel|suites|suite|logistics|consulting)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length >= 13) {
    return '0' + digits.slice(3);
  }
  return digits;
}

function computeLeadSimilarity(a: any, b: any): PairSimilarityResult {
  const reasons: string[] = [];
  const phoneA = cleanPhone(a.phone);
  const phoneB = cleanPhone(b.phone);
  const hasPhoneMatch = Boolean(phoneA && phoneB && phoneA.length >= 7 && phoneA === phoneB);

  const emailA = a.email?.trim().toLowerCase();
  const emailB = b.email?.trim().toLowerCase();
  const hasEmailMatch = Boolean(emailA && emailB && emailA === emailB);

  const rawNameSim = stringSimilarityRatio(a.businessName || '', b.businessName || '');
  const cleanNameA = cleanBusinessName(a.businessName || '');
  const cleanNameB = cleanBusinessName(b.businessName || '');
  const cleanLevSim = stringSimilarityRatio(cleanNameA, cleanNameB);
  const cleanDiceSim = tokenDiceSimilarity(cleanNameA, cleanNameB);
  const nameSim = Math.max(rawNameSim, cleanLevSim, cleanDiceSim);

  const contactSim = (a.contactName && b.contactName)
    ? stringSimilarityRatio(a.contactName, b.contactName)
    : 0;

  const locA = (a.location || a.businessAddress || '').trim().toLowerCase();
  const locB = (b.location || b.businessAddress || '').trim().toLowerCase();
  const locSim = (locA && locB) ? stringSimilarityRatio(locA, locB) : 0;

  let totalScore = 0;

  if (hasPhoneMatch) {
    reasons.push('Identical Phone Number');
    totalScore = Math.min(100, Math.round(88 + (nameSim * 12)));
  } else if (hasEmailMatch) {
    reasons.push('Identical Email Address');
    totalScore = Math.min(100, Math.round(85 + (nameSim * 15)));
  } else {
    // Weighted scoring: Name 70%, Contact 15%, Location 15%
    const weighted = (nameSim * 70) + (contactSim * 15) + (locSim * 15);
    totalScore = Math.min(100, Math.round(weighted));
  }

  if (nameSim >= 0.85) {
    reasons.push(`${Math.round(nameSim * 100)}% Business Name Match`);
  } else if (nameSim >= 0.65) {
    reasons.push(`Similar Business Name (${Math.round(nameSim * 100)}%)`);
  }

  if (contactSim >= 0.8) {
    reasons.push('Matching Contact Person');
  }

  if (locSim >= 0.8) {
    reasons.push('Same Address / Location');
  }

  return {
    score: totalScore,
    reasons,
  };
}

